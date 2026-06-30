"""任务执行器，负责读取任务配置、采集模型样本、计算评分并写回 Redis。"""

from __future__ import annotations

import time
import uuid
from collections.abc import Awaitable, Callable

from app.config import Settings
from app.fingerprint_algorithm import MIN_VALID_SAMPLES
from app.models import ReferenceView, RunView
from app.provider import ProgressReporter, ProviderRequest, collect_numbers
from app.repository import RedisRepository
from app.scoring import (
    calculate_distribution,
    calculate_stats,
    display_score,
    raw_similarity,
    smooth_score,
)
from app.security import decrypt_api_key

NumberCollector = Callable[
    [ProviderRequest, int, float, ProgressReporter | None],
    Awaitable[tuple[list[int], list[str]]],
]


class TaskRunner:
    """执行单个监控任务的业务编排器，隔离 API 层与模型采样细节。"""

    def __init__(
        self,
        repository: RedisRepository,
        settings: Settings,
        number_collector: NumberCollector = collect_numbers,
        progress_reporter: ProgressReporter | None = None,
    ):
        """注入仓库、配置和采样函数，使生产采样与测试模拟可以共用同一评分流程。"""

        self.repository = repository
        self.settings = settings
        self.number_collector = number_collector
        self.progress_reporter = progress_reporter

    async def run_task(self, task_id: str) -> RunView:
        """运行一次任务采样，并与任务选择的独立参照分布计算相似度。"""

        owner = str(uuid.uuid4())
        if not await self.repository.acquire_task_lock(task_id, owner):
            raise RuntimeError("任务正在运行中，请稍后再试")
        try:
            task = await self.repository.get_task(task_id, include_secret=True)
            if not isinstance(task, dict):
                raise RuntimeError("任务不存在")
            return await self._execute(task)
        finally:
            await self.repository.release_task_lock(task_id, owner)

    async def run_reference(self, reference_id: str) -> RunView:
        """单独运行参照标定，生成后续任务可选择和比较的基准分布。"""

        owner = str(uuid.uuid4())
        lock_id = f"reference:{reference_id}"
        if not await self.repository.acquire_task_lock(lock_id, owner):
            raise RuntimeError("参照正在运行中，请稍后再试")
        try:
            reference = await self.repository.get_reference(reference_id, include_secret=True)
            if not isinstance(reference, dict):
                raise RuntimeError("参照不存在")
            return await self._execute_reference(reference)
        finally:
            await self.repository.release_task_lock(lock_id, owner)

    async def _execute(self, task: dict) -> RunView:
        """执行采样和评分的核心流程，任务题目和次数始终继承参照测试协议。"""

        run_id = str(uuid.uuid4())
        started_at = time.time()
        reference_id = task.get("reference_id")
        if not reference_id:
            raise RuntimeError("任务未选择参照，无法计算相似度")
        reference = await self.repository.get_reference(reference_id)
        if not isinstance(reference, ReferenceView):
            raise RuntimeError("任务参照不存在，请重新选择参照")
        reference_distribution = await self.repository.get_reference_latest_distribution(
            reference_id,
        )
        if reference_distribution is None:
            raise RuntimeError("任务参照尚未运行，请先在参照管理中运行参照")
        sample_count = reference.sample_count
        request = ProviderRequest(
            provider=task["provider"],
            base_url=task["base_url"],
            api_key=decrypt_api_key(task["api_key"], self.settings.secret_key),
            model=task["model"],
            prompt=reference.prompt,
            timeout_seconds=self.settings.provider_timeout_seconds,
        )
        numbers, errors = await self.number_collector(
            request,
            sample_count,
            self.settings.request_delay_seconds,
            self.progress_reporter,
        )
        completed_at = time.time()
        if len(numbers) < MIN_VALID_SAMPLES:
            run = self._build_failed_run(
                run_id=run_id,
                task=task,
                started_at=started_at,
                completed_at=completed_at,
                numbers=numbers,
                errors=errors,
                sample_count=sample_count,
            )
            await self.repository.save_run(run, calculate_distribution(numbers), numbers)
            await self.repository.finalize_task_after_run(
                task["id"],
                run_id,
                run.smooth_score,
                task["interval_seconds"],
            )
            return run

        distribution = calculate_distribution(numbers)
        active_baseline_run_id, baseline_distribution = reference_distribution
        raw_score = raw_similarity(distribution, baseline_distribution)

        public_score = display_score(raw_score)
        previous_smooth = await self.repository.get_previous_smooth_score(task["id"])
        smoothed = smooth_score(public_score, previous_smooth, task["smoothing_level"])
        run = RunView(
            id=run_id,
            task_id=task["id"],
            status="success",
            started_at=started_at,
            completed_at=completed_at,
            sample_count=sample_count,
            success_count=len(numbers),
            failed_count=len(errors),
            raw_similarity=raw_score,
            display_score=public_score,
            smooth_score=smoothed,
            baseline_run_id=active_baseline_run_id,
            error_summary=self._summarize_errors(errors),
            stats=calculate_stats(numbers),
        )
        await self.repository.save_run(run, distribution, numbers)
        await self.repository.finalize_task_after_run(
            task["id"],
            run_id,
            run.smooth_score,
            task["interval_seconds"],
        )
        return run

    async def _execute_reference(self, reference: dict) -> RunView:
        """执行参照采样并保存为可复用基准分布，不参与任务评分调度。"""

        run_id = str(uuid.uuid4())
        started_at = time.time()
        request = ProviderRequest(
            provider=reference["provider"],
            base_url=reference["base_url"],
            api_key=decrypt_api_key(reference["api_key"], self.settings.secret_key),
            model=reference["model"],
            prompt=reference["prompt"],
            timeout_seconds=self.settings.provider_timeout_seconds,
        )
        numbers, errors = await self.number_collector(
            request,
            reference["sample_count"],
            self.settings.request_delay_seconds,
            self.progress_reporter,
        )
        completed_at = time.time()
        if len(numbers) < MIN_VALID_SAMPLES:
            run = RunView(
                id=run_id,
                task_id=reference["id"],
                status="failed",
                started_at=started_at,
                completed_at=completed_at,
                sample_count=reference["sample_count"],
                success_count=len(numbers),
                failed_count=max(len(errors), reference["sample_count"] - len(numbers)),
                raw_similarity=0.0,
                display_score=90.0,
                smooth_score=90.0,
                baseline_run_id=None,
                error_summary=self._summarize_errors(errors) or "有效采样少于 10 个，无法建立参照",
                stats=calculate_stats(numbers),
            )
            await self.repository.save_reference_run(
                reference["id"],
                run,
                calculate_distribution(numbers),
                numbers,
            )
            return run

        distribution = calculate_distribution(numbers)
        run = RunView(
            id=run_id,
            task_id=reference["id"],
            status="success",
            started_at=started_at,
            completed_at=completed_at,
            sample_count=reference["sample_count"],
            success_count=len(numbers),
            failed_count=len(errors),
            raw_similarity=1.0,
            display_score=100.0,
            smooth_score=100.0,
            baseline_run_id=run_id,
            error_summary=self._summarize_errors(errors),
            stats=calculate_stats(numbers),
        )
        await self.repository.save_reference_run(reference["id"], run, distribution, numbers)
        return run

    def _build_failed_run(
        self,
        run_id: str,
        task: dict,
        started_at: float,
        completed_at: float,
        numbers: list[int],
        errors: list[str],
        sample_count: int,
    ) -> RunView:
        """构造失败运行记录，沿用参照采样次数避免任务协议漂移。"""

        previous_smooth = task.get("last_smooth_score")
        fallback_score = previous_smooth if previous_smooth is not None else 90.0
        return RunView(
            id=run_id,
            task_id=task["id"],
            status="failed",
            started_at=started_at,
            completed_at=completed_at,
            sample_count=sample_count,
            success_count=len(numbers),
            failed_count=max(len(errors), sample_count - len(numbers)),
            raw_similarity=0.0,
            display_score=90.0,
            smooth_score=fallback_score,
            baseline_run_id=task.get("baseline_run_id"),
            error_summary=self._summarize_errors(errors) or "有效采样少于 10 个，无法计算相似度",
            stats=calculate_stats(numbers),
        )

    def _summarize_errors(self, errors: list[str]) -> str | None:
        """压缩采样错误，避免运行列表被大量重复 Provider 错误淹没。"""

        if not errors:
            return None
        preview = "；".join(errors[:3])
        if len(errors) > 3:
            return f"{preview}；另有 {len(errors) - 3} 个错误"
        return preview
