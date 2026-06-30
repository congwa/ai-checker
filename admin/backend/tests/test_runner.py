"""任务执行器测试，验证运行时评分流程遵守参照测试协议。"""

from __future__ import annotations

import fakeredis.aioredis

from app.config import Settings
from app.models import ReferenceCreate, RunView, TaskCreate
from app.provider import ProgressReporter, ProviderRequest
from app.repository import RedisRepository
from app.runner import TaskRunner
from app.security import encrypt_api_key


async def test_task_runner_uses_reference_protocol_even_when_task_snapshot_drifts() -> None:
    """任务运行必须使用参照题目和采样次数，避免旧任务快照破坏分布可比性。"""

    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    repository = RedisRepository(redis)
    settings = Settings(
        redis_url="redis://test",
        admin_token="test-token",
        secret_key="test-secret",
        cors_origins=[],
        scheduler_poll_seconds=60,
        provider_timeout_seconds=5,
        request_delay_seconds=0,
    )
    captured: dict[str, object] = {}

    async def collect_fixed_numbers(
        request: ProviderRequest,
        sample_count: int,
        delay_seconds: float,
        progress_reporter: ProgressReporter | None,
    ) -> tuple[list[int], list[str]]:
        """记录 Runner 下发给 Provider 的业务协议，并返回足量固定采样。"""

        captured["prompt"] = request.prompt
        captured["sample_count"] = sample_count
        captured["delay_seconds"] = delay_seconds
        return [1] * sample_count, []

    reference = await repository.create_reference(
        ReferenceCreate(
            name="协议参照",
            base_url="https://api.example.com/v1",
            api_key="secret",
            model="gpt-reference",
            prompt="reference-question",
            sample_count=12,
        ),
        encrypted_api_key=encrypt_api_key("secret", settings.secret_key),
    )
    reference_run = RunView(
        id="run-reference",
        task_id=reference.id,
        status="success",
        started_at=1.0,
        completed_at=2.0,
        sample_count=12,
        success_count=12,
        failed_count=0,
        raw_similarity=1.0,
        display_score=100.0,
        smooth_score=100.0,
        baseline_run_id="run-reference",
        stats={"mean": 1.0},
    )
    await repository.save_reference_run(
        reference.id,
        reference_run,
        [1.0] + [0.0] * 354,
        [1] * 12,
    )
    task = await repository.create_task(
        TaskCreate(
            name="漂移任务",
            base_url="https://api.example.com/v1",
            api_key="secret",
            model="gpt-task",
            reference_id=reference.id,
        ),
        encrypted_api_key=encrypt_api_key("secret", settings.secret_key),
    )
    await redis.hset(
        f"task:{task.id}",
        mapping={
            "prompt": "stale-task-question",
            "sample_count": "99",
        },
    )

    runner = TaskRunner(repository, settings, number_collector=collect_fixed_numbers)
    run = await runner.run_task(task.id)

    assert captured["prompt"] == "reference-question"
    assert captured["sample_count"] == 12
    assert run.sample_count == 12
    assert run.status == "success"
