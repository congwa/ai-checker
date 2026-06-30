"""Redis 仓库层，统一管理任务、运行结果、公开索引和调度锁的持久化规则。"""

from __future__ import annotations

import json
import time
import uuid
from typing import Any

from redis.asyncio import Redis

from app.models import (
    ReferenceCreate,
    ReferenceUpdate,
    ReferenceView,
    RunDetail,
    RunJobKind,
    RunJobStatus,
    RunJobView,
    RunView,
    TaskCreate,
    TaskUpdate,
    TaskView,
)
from app.scoring import is_score_in_public_range, ranged_public_score


class RedisRepository:
    """封装 AI Checker 的 Redis key 约定，让 API、Runner 和 Scheduler 共享同一数据语义。"""

    def __init__(self, redis: Redis):
        """接收 Redis 客户端，便于生产环境连接真实 Redis、测试环境注入 fakeredis。"""

        self.redis = redis

    async def close(self) -> None:
        """关闭 Redis 连接，释放后台服务生命周期结束时的网络资源。"""

        await self.redis.aclose()

    async def create_task(self, payload: TaskCreate, encrypted_api_key: str) -> TaskView:
        """创建监控任务并维护公开索引，保证新任务立即可被后台和调度器发现。"""

        now = time.time()
        task_id = str(uuid.uuid4())
        raw_task = {
            "id": task_id,
            "name": payload.name,
            "provider": payload.provider,
            "base_url": payload.base_url,
            "api_key": encrypted_api_key,
            "model": payload.model,
            "reference_id": payload.reference_id,
            "prompt": payload.prompt,
            "sample_count": str(payload.sample_count),
            "interval_seconds": str(payload.interval_seconds),
            "smoothing_level": str(payload.smoothing_level),
            "enabled": self._bool_to_str(payload.enabled),
            "public_enabled": self._bool_to_str(payload.public_enabled),
            "public_score_range_enabled": self._bool_to_str(
                payload.public_score_range_enabled,
            ),
            "public_score_min": str(payload.public_score_min),
            "public_score_max": str(payload.public_score_max),
            "baseline_run_id": "",
            "last_run_id": "",
            "last_smooth_score": "",
            "next_run_at": str(now),
            "created_at": str(now),
            "updated_at": str(now),
        }
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.hset(self._task_key(task_id), mapping=raw_task)
            pipe.sadd("task:index", task_id)
            if payload.public_enabled:
                pipe.sadd("public:task:index", task_id)
            await pipe.execute()
        return self._decode_task(raw_task)

    async def update_task(
        self,
        task_id: str,
        payload: TaskUpdate,
        encrypted_api_key: str | None,
    ) -> TaskView | None:
        """更新任务配置并同步公开索引，空 API Key 不覆盖已有密钥。"""

        task = await self.get_task(task_id, include_secret=True)
        if task is None:
            return None
        updates: dict[str, Any] = payload.model_dump(exclude_unset=True)
        if not updates.get("api_key"):
            updates.pop("api_key", None)
        elif encrypted_api_key:
            updates["api_key"] = encrypted_api_key
        for key, value in list(updates.items()):
            if isinstance(value, bool):
                updates[key] = self._bool_to_str(value)
            elif value is None:
                updates.pop(key)
            else:
                updates[key] = str(value)
        updates["updated_at"] = str(time.time())
        await self.redis.hset(self._task_key(task_id), mapping=updates)
        updated = await self.get_task(task_id)
        if updated is not None:
            await self._sync_public_index(task_id, updated.public_enabled)
        return updated

    async def list_tasks(self) -> list[TaskView]:
        """返回全部后台任务，供管理端列表展示和人工排查使用。"""

        task_ids = sorted(await self.redis.smembers("task:index"))
        tasks = [task for task_id in task_ids if (task := await self.get_task(task_id)) is not None]
        return sorted(tasks, key=lambda task: task.created_at, reverse=True)

    async def create_reference(
        self,
        payload: ReferenceCreate,
        encrypted_api_key: str,
    ) -> ReferenceView:
        """创建参照配置，让后台可以单独标定一个 AI 的基准分布。"""

        now = time.time()
        reference_id = str(uuid.uuid4())
        raw_reference = {
            "id": reference_id,
            "name": payload.name,
            "provider": payload.provider,
            "base_url": payload.base_url,
            "api_key": encrypted_api_key,
            "model": payload.model,
            "prompt": payload.prompt,
            "sample_count": str(payload.sample_count),
            "latest_run_id": "",
            "latest_success_run_id": "",
            "latest_run_status": "",
            "created_at": str(now),
            "updated_at": str(now),
        }
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.hset(self._reference_key(reference_id), mapping=raw_reference)
            pipe.sadd("reference:index", reference_id)
            await pipe.execute()
        return self._decode_reference(raw_reference)

    async def update_reference(
        self,
        reference_id: str,
        payload: ReferenceUpdate,
        encrypted_api_key: str | None,
    ) -> ReferenceView | None:
        """更新参照配置，空 API Key 不覆盖已有参照密钥。"""

        reference = await self.get_reference(reference_id, include_secret=True)
        if reference is None:
            return None
        updates: dict[str, Any] = payload.model_dump(exclude_unset=True)
        if not updates.get("api_key"):
            updates.pop("api_key", None)
        elif encrypted_api_key:
            updates["api_key"] = encrypted_api_key
        for key, value in list(updates.items()):
            if value is None:
                updates.pop(key)
            else:
                updates[key] = str(value)
        updates["updated_at"] = str(time.time())
        await self.redis.hset(self._reference_key(reference_id), mapping=updates)
        updated = await self.get_reference(reference_id)
        return updated if isinstance(updated, ReferenceView) else None

    async def list_references(self) -> list[ReferenceView]:
        """返回全部参照配置，供任务创建时选择明确的比较基准。"""

        reference_ids = sorted(await self.redis.smembers("reference:index"))
        references = [
            reference
            for reference_id in reference_ids
            if (reference := await self.get_reference(reference_id)) is not None
        ]
        return sorted(references, key=lambda reference: reference.created_at, reverse=True)

    async def get_reference(
        self,
        reference_id: str,
        include_secret: bool = False,
    ) -> ReferenceView | dict[str, Any] | None:
        """读取参照配置；Runner 可要求包含密钥字段，API 默认只返回脱敏视图。"""

        raw_reference = await self.redis.hgetall(self._reference_key(reference_id))
        if not raw_reference:
            return None
        if include_secret:
            return self._decode_reference_dict(raw_reference)
        return self._decode_reference(raw_reference)

    async def delete_reference(self, reference_id: str) -> bool:
        """删除参照配置；已保存的参照运行保留用于审计。"""

        existed = await self.redis.srem("reference:index", reference_id)
        await self.redis.delete(self._reference_key(reference_id))
        return bool(existed)

    async def save_reference_run(
        self,
        reference_id: str,
        run: RunView,
        distribution: list[float],
        numbers: list[int],
    ) -> RunView:
        """保存参照标定运行，并更新参照的最新可用分布。"""

        await self.save_run(run, distribution, numbers)
        updates = {
            "latest_run_id": run.id,
            "latest_run_status": run.status,
            "updated_at": str(time.time()),
        }
        if run.status == "success":
            updates["latest_success_run_id"] = run.id
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.zadd(f"reference:{reference_id}:runs", {run.id: run.completed_at})
            pipe.hset(self._reference_key(reference_id), mapping=updates)
            await pipe.execute()
        return run

    async def list_reference_history(self, reference_id: str, limit: int = 50) -> list[RunView]:
        """按完成时间倒序返回参照标定历史，供后台参照管理页展示。"""

        run_ids = await self.redis.zrevrange(f"reference:{reference_id}:runs", 0, limit - 1)
        return [run for run_id in run_ids if (run := await self.get_run(run_id)) is not None]

    async def get_reference_latest_distribution(
        self,
        reference_id: str,
    ) -> tuple[str, list[float]] | None:
        """读取参照最新成功运行的分布，任务执行时用它作为比较基准。"""

        reference = await self.get_reference(reference_id)
        if not isinstance(reference, ReferenceView) or not reference.latest_success_run_id:
            return None
        distribution = await self.get_run_distribution(reference.latest_success_run_id)
        if not distribution:
            return None
        return reference.latest_success_run_id, distribution

    async def create_or_get_run_job(
        self,
        kind: RunJobKind,
        target_id: str,
        progress_total: int,
        message: str,
    ) -> tuple[RunJobView, bool]:
        """创建或复用目标的活跃运行 Job，避免用户重复点击触发多次采样。"""

        active_key = self._active_run_job_key(kind, target_id)
        active_job_id = await self.redis.get(active_key)
        if active_job_id:
            active_job = await self.get_run_job(active_job_id)
            if active_job is not None and active_job.status in {"queued", "running"}:
                return active_job, False
        now = time.time()
        job_id = str(uuid.uuid4())
        raw_job = {
            "id": job_id,
            "kind": kind,
            "target_id": target_id,
            "status": "queued",
            "run_id": "",
            "progress_current": "0",
            "progress_total": str(progress_total),
            "success_count": "0",
            "failed_count": "0",
            "message": message,
            "error_summary": "",
            "created_at": str(now),
            "started_at": "",
            "completed_at": "",
            "updated_at": str(now),
        }
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.hset(self._run_job_key(job_id), mapping=raw_job)
            pipe.set(active_key, job_id, ex=900)
            pipe.sadd("run_job:active:index", self._active_run_job_token(kind, target_id))
            await pipe.execute()
        return self._decode_run_job(raw_job), True

    async def get_run_job(self, job_id: str) -> RunJobView | None:
        """读取手动运行 Job 状态，供前端轮询展示等待、成功或失败。"""

        raw_job = await self.redis.hgetall(self._run_job_key(job_id))
        if not raw_job:
            return None
        return self._decode_run_job(raw_job)

    async def list_active_run_jobs(self) -> list[RunJobView]:
        """返回仍在排队或运行中的 Job，便于页面刷新后恢复等待反馈。"""

        jobs: list[RunJobView] = []
        for token in await self.redis.smembers("run_job:active:index"):
            active_job_id = await self.redis.get(f"run_job:active:{token}")
            if not active_job_id:
                await self.redis.srem("run_job:active:index", token)
                continue
            job = await self.get_run_job(active_job_id)
            if job is None or job.status not in {"queued", "running"}:
                await self.redis.srem("run_job:active:index", token)
                continue
            jobs.append(job)
        return sorted(jobs, key=lambda job: job.created_at, reverse=True)

    async def start_run_job(self, job_id: str, message: str) -> RunJobView | None:
        """把 Job 标记为运行中，让用户知道后台已经开始实际采样。"""

        now = time.time()
        await self.redis.hset(
            self._run_job_key(job_id),
            mapping={
                "status": "running",
                "started_at": str(now),
                "updated_at": str(now),
                "message": message,
            },
        )
        return await self.get_run_job(job_id)

    async def update_run_job_progress(
        self,
        job_id: str,
        progress_current: int,
        progress_total: int,
        success_count: int,
        failed_count: int,
        message: str,
    ) -> RunJobView | None:
        """更新采样进度和成功失败数量，支撑前端行内进度反馈。"""

        await self.redis.hset(
            self._run_job_key(job_id),
            mapping={
                "progress_current": str(progress_current),
                "progress_total": str(progress_total),
                "success_count": str(success_count),
                "failed_count": str(failed_count),
                "message": message,
                "updated_at": str(time.time()),
            },
        )
        return await self.get_run_job(job_id)

    async def finish_run_job(
        self,
        job_id: str,
        status: RunJobStatus,
        run_id: str | None,
        success_count: int,
        failed_count: int,
        message: str,
        error_summary: str | None = None,
    ) -> RunJobView | None:
        """结束 Job 并清理活跃索引，让用户看到最终结果且重复点击可启动新运行。"""

        job = await self.get_run_job(job_id)
        if job is None:
            return None
        now = time.time()
        await self.redis.hset(
            self._run_job_key(job_id),
            mapping={
                "status": status,
                "run_id": run_id or "",
                "progress_current": str(job.progress_total),
                "success_count": str(success_count),
                "failed_count": str(failed_count),
                "message": message,
                "error_summary": error_summary or "",
                "completed_at": str(now),
                "updated_at": str(now),
            },
        )
        await self._clear_active_run_job(job.kind, job.target_id)
        return await self.get_run_job(job_id)

    async def get_task(
        self,
        task_id: str,
        include_secret: bool = False,
    ) -> TaskView | dict[str, Any] | None:
        """读取任务配置；Runner 可要求包含密钥字段，API 默认只返回脱敏视图。"""

        raw_task = await self.redis.hgetall(self._task_key(task_id))
        if not raw_task:
            return None
        if include_secret:
            return self._decode_task_dict(raw_task)
        return self._decode_task(raw_task)

    async def delete_task(self, task_id: str) -> bool:
        """删除任务和公开索引，保留历史 run 以便后续审计 Redis 数据。"""

        existed = await self.redis.srem("task:index", task_id)
        await self.redis.srem("public:task:index", task_id)
        await self.redis.delete(self._task_key(task_id))
        return bool(existed)

    async def save_run(
        self,
        run: RunView,
        distribution: list[float],
        numbers: list[int],
    ) -> RunView:
        """保存一次采样运行结果、分布、原始数字和当时使用的参照运行。"""

        raw_run = {
            "id": run.id,
            "task_id": run.task_id,
            "status": run.status,
            "started_at": str(run.started_at),
            "completed_at": str(run.completed_at),
            "sample_count": str(run.sample_count),
            "success_count": str(run.success_count),
            "failed_count": str(run.failed_count),
            "raw_similarity": str(run.raw_similarity),
            "display_score": str(run.display_score),
            "smooth_score": str(run.smooth_score),
            "public_enabled": self._bool_to_str(run.public_enabled and run.status == "success"),
            "public_score_override": str(run.public_score_override)
            if run.public_score_override is not None
            else "",
            "baseline_run_id": run.baseline_run_id or "",
            "error_summary": run.error_summary or "",
            "stats": json.dumps(run.stats, ensure_ascii=False),
        }
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.hset(self._run_key(run.id), mapping=raw_run)
            pipe.set(f"run:{run.id}:dist", json.dumps(distribution))
            pipe.set(f"run:{run.id}:numbers", json.dumps(numbers))
            pipe.zadd(f"task:{run.task_id}:runs", {run.id: run.completed_at})
            await pipe.execute()
        return run

    async def list_runs(self, task_id: str, limit: int = 50) -> list[RunView]:
        """按完成时间倒序返回任务运行历史，支持后台查看近期采样质量。"""

        run_ids = await self.redis.zrevrange(f"task:{task_id}:runs", 0, limit - 1)
        runs = [run for run_id in run_ids if (run := await self.get_run(run_id)) is not None]
        public_scores = await self._get_effective_public_scores(task_id)
        for run in runs:
            if run.id in public_scores:
                run.public_score = public_scores[run.id]
        return runs

    async def get_run(self, run_id: str) -> RunView | None:
        """读取单次运行概要，供曲线聚合、详情查看和后台历史列表复用。"""

        raw_run = await self.redis.hgetall(self._run_key(run_id))
        if not raw_run:
            return None
        return self._decode_run(raw_run)

    async def delete_run(self, owner_id: str, run_id: str) -> bool:
        """删除某次任务或参照运行记录，并同步清理曲线索引和最新摘要。"""

        raw_run = await self.redis.hgetall(self._run_key(run_id))
        if not raw_run or raw_run.get("task_id") != owner_id:
            return False
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.zrem(f"task:{owner_id}:runs", run_id)
            pipe.zrem(f"reference:{owner_id}:runs", run_id)
            pipe.delete(self._run_key(run_id))
            pipe.delete(f"run:{run_id}:dist")
            pipe.delete(f"run:{run_id}:numbers")
            await pipe.execute()

        if await self.redis.exists(self._task_key(owner_id)):
            await self._refresh_task_latest_run(owner_id)
        if await self.redis.exists(self._reference_key(owner_id)):
            await self._refresh_reference_latest_runs(owner_id)
        return True

    async def update_run_public_settings(
        self,
        task_id: str,
        run_id: str,
        public_enabled: bool | None,
        public_score_override: float | None,
        public_score_override_provided: bool,
    ) -> RunView | None:
        """更新某次运行的前台可见性和展示分数覆盖，不改变真实评分结果。"""

        raw_run = await self.redis.hgetall(self._run_key(run_id))
        if not raw_run or raw_run.get("task_id") != task_id:
            return None
        updates: dict[str, str] = {}
        if public_enabled is not None:
            updates["public_enabled"] = self._bool_to_str(
                public_enabled and raw_run.get("status") == "success",
            )
        if public_score_override_provided:
            updates["public_score_override"] = (
                str(public_score_override) if public_score_override is not None else ""
            )
        if updates:
            await self.redis.hset(self._run_key(run_id), mapping=updates)
        run = await self.get_run(run_id)
        if run is None:
            return None
        public_scores = await self._get_effective_public_scores(task_id)
        if run.id in public_scores:
            run.public_score = public_scores[run.id]
        return run

    async def get_run_detail(self, run_id: str) -> RunDetail | None:
        """读取单次运行详情，附带分布和原始采样以支持后台审计。"""

        run = await self.get_run(run_id)
        if run is None:
            return None
        public_scores = await self._get_effective_public_scores(run.task_id)
        if run.id in public_scores:
            run.public_score = public_scores[run.id]
        return RunDetail(
            **run.model_dump(),
            distribution=await self.get_run_distribution(run_id),
            numbers=await self.get_run_numbers(run_id),
        )

    async def get_run_distribution(self, run_id: str) -> list[float]:
        """读取运行分布，作为相似度计算和图表绘制的直接输入。"""

        raw = await self.redis.get(f"run:{run_id}:dist")
        return json.loads(raw) if raw else []

    async def get_run_numbers(self, run_id: str) -> list[int]:
        """读取运行原始数字，便于后台追踪异常分布的具体采样来源。"""

        raw = await self.redis.get(f"run:{run_id}:numbers")
        return json.loads(raw) if raw else []

    async def finalize_task_after_run(
        self,
        task_id: str,
        run_id: str,
        smooth_score_value: float,
        interval_seconds: int,
    ) -> None:
        """运行完成后更新任务最新状态和下次调度时间，让调度器按任务频率继续执行。"""

        await self.redis.hset(
            self._task_key(task_id),
            mapping={
                "last_run_id": run_id,
                "last_smooth_score": str(smooth_score_value),
                "next_run_at": str(time.time() + interval_seconds),
                "updated_at": str(time.time()),
            },
        )

    async def get_due_tasks(self, now: float | None = None) -> list[dict[str, Any]]:
        """返回已启用且到期的任务，供调度器每轮扫描时执行。"""

        current = now if now is not None else time.time()
        due_tasks: list[dict[str, Any]] = []
        for task_id in await self.redis.smembers("task:index"):
            task = await self.get_task(task_id, include_secret=True)
            if isinstance(task, dict) and task["enabled"] and task["next_run_at"] <= current:
                due_tasks.append(task)
        return due_tasks

    async def acquire_task_lock(self, task_id: str, owner: str, ttl_seconds: int = 900) -> bool:
        """为任务执行加互斥锁，避免手动运行和定时调度同时采样同一模型。"""

        return bool(await self.redis.set(f"lock:task:{task_id}", owner, nx=True, ex=ttl_seconds))

    async def release_task_lock(self, task_id: str, owner: str) -> None:
        """释放当前 Runner 持有的任务锁，避免误删其他执行者新建的锁。"""

        key = f"lock:task:{task_id}"
        if await self.redis.get(key) == owner:
            await self.redis.delete(key)

    async def get_previous_smooth_score(self, task_id: str) -> float | None:
        """读取任务上次平滑分数，让新分数能延续前台曲线的业务稳定性。"""

        value = await self.redis.hget(self._task_key(task_id), "last_smooth_score")
        return float(value) if value else None

    async def get_series(self, task_id: str, since_timestamp: float) -> list[RunView]:
        """按时间窗口返回成功运行点，供后台或公开端绘制评分曲线。"""

        run_ids = await self.redis.zrangebyscore(f"task:{task_id}:runs", since_timestamp, "+inf")
        runs = [run for run_id in run_ids if (run := await self.get_run(run_id)) is not None]
        public_scores = await self._get_effective_public_scores(task_id)
        for run in runs:
            if run.id in public_scores:
                run.public_score = public_scores[run.id]
        return [run for run in runs if run.status == "success"]

    async def _refresh_task_latest_run(self, task_id: str) -> None:
        """运行记录删除后，重新计算任务卡片上的最新运行摘要。"""

        latest_raw_run: dict[str, Any] | None = None
        for run_id in await self.redis.zrevrange(f"task:{task_id}:runs", 0, -1):
            raw_run = await self.redis.hgetall(self._run_key(run_id))
            if raw_run:
                latest_raw_run = raw_run
                break
            await self.redis.zrem(f"task:{task_id}:runs", run_id)
        await self.redis.hset(
            self._task_key(task_id),
            mapping={
                "last_run_id": latest_raw_run["id"] if latest_raw_run else "",
                "last_smooth_score": latest_raw_run["smooth_score"] if latest_raw_run else "",
                "updated_at": str(time.time()),
            },
        )

    async def _refresh_reference_latest_runs(self, reference_id: str) -> None:
        """运行记录删除后，重新计算参照的最新运行和最新成功基准。"""

        latest_raw_run: dict[str, Any] | None = None
        latest_success_run_id = ""
        for run_id in await self.redis.zrevrange(f"reference:{reference_id}:runs", 0, -1):
            raw_run = await self.redis.hgetall(self._run_key(run_id))
            if not raw_run:
                await self.redis.zrem(f"reference:{reference_id}:runs", run_id)
                continue
            if latest_raw_run is None:
                latest_raw_run = raw_run
            if raw_run.get("status") == "success" and not latest_success_run_id:
                latest_success_run_id = raw_run["id"]
            if latest_raw_run is not None and latest_success_run_id:
                break

        await self.redis.hset(
            self._reference_key(reference_id),
            mapping={
                "latest_run_id": latest_raw_run["id"] if latest_raw_run else "",
                "latest_success_run_id": latest_success_run_id,
                "latest_run_status": latest_raw_run["status"] if latest_raw_run else "",
                "updated_at": str(time.time()),
            },
        )

    def _task_key(self, task_id: str) -> str:
        """生成任务 Hash key，确保所有模块使用同一 Redis 命名约定。"""

        return f"task:{task_id}"

    def _reference_key(self, reference_id: str) -> str:
        """生成参照 Hash key，确保参照配置与任务配置分开存储。"""

        return f"reference:{reference_id}"

    def _run_key(self, run_id: str) -> str:
        """生成运行 Hash key，确保运行概要和分布详情能稳定关联。"""

        return f"run:{run_id}"

    def _run_job_key(self, job_id: str) -> str:
        """生成手动运行 Job 的 Hash key，让轮询接口能读取同一状态记录。"""

        return f"run_job:{job_id}"

    def _active_run_job_token(self, kind: RunJobKind, target_id: str) -> str:
        """生成目标活跃 Job 标识，用于防止同一参照或任务被重复运行。"""

        return f"{kind}:{target_id}"

    def _active_run_job_key(self, kind: RunJobKind, target_id: str) -> str:
        """生成目标活跃 Job key，让重复点击可以复用已有后台运行。"""

        return f"run_job:active:{self._active_run_job_token(kind, target_id)}"

    async def _clear_active_run_job(self, kind: RunJobKind, target_id: str) -> None:
        """清理目标活跃 Job 索引，保证终态 Job 不再阻塞下一次手动运行。"""

        token = self._active_run_job_token(kind, target_id)
        await self.redis.delete(f"run_job:active:{token}")
        await self.redis.srem("run_job:active:index", token)

    async def _sync_public_index(self, task_id: str, public_enabled: bool) -> None:
        """根据任务公开开关维护前台可见任务集合，避免前台读取后台私有任务。"""

        if public_enabled:
            await self.redis.sadd("public:task:index", task_id)
        else:
            await self.redis.srem("public:task:index", task_id)

    def _decode_task(self, raw_task: dict[str, Any]) -> TaskView:
        """把 Redis 字符串字段转换为后台 API 可返回的脱敏任务视图。"""

        task = self._decode_task_dict(raw_task)
        task.pop("api_key", None)
        return TaskView(**task)

    def _decode_task_dict(self, raw_task: dict[str, Any]) -> dict[str, Any]:
        """把 Redis Hash 转换为业务类型字典，供 Runner 和 API 复用。"""

        return {
            "id": raw_task["id"],
            "name": raw_task["name"],
            "provider": raw_task["provider"],
            "base_url": raw_task["base_url"],
            "api_key": raw_task.get("api_key", ""),
            "model": raw_task["model"],
            "reference_id": raw_task.get("reference_id") or None,
            "prompt": raw_task["prompt"],
            "sample_count": int(raw_task["sample_count"]),
            "interval_seconds": int(raw_task["interval_seconds"]),
            "smoothing_level": int(raw_task["smoothing_level"]),
            "enabled": self._str_to_bool(raw_task["enabled"]),
            "public_enabled": self._str_to_bool(raw_task["public_enabled"]),
            "public_score_range_enabled": self._str_to_bool(
                raw_task.get("public_score_range_enabled", "0"),
            ),
            "public_score_min": float(raw_task.get("public_score_min") or 85.0),
            "public_score_max": float(raw_task.get("public_score_max") or 100.0),
            "baseline_run_id": raw_task.get("baseline_run_id") or None,
            "last_run_id": raw_task.get("last_run_id") or None,
            "last_smooth_score": float(raw_task["last_smooth_score"])
            if raw_task.get("last_smooth_score")
            else None,
            "next_run_at": float(raw_task["next_run_at"]),
            "created_at": float(raw_task["created_at"]),
            "updated_at": float(raw_task["updated_at"]),
        }

    def _decode_reference(self, raw_reference: dict[str, Any]) -> ReferenceView:
        """把 Redis 字符串字段转换为后台 API 可返回的脱敏参照视图。"""

        reference = self._decode_reference_dict(raw_reference)
        reference.pop("api_key", None)
        return ReferenceView(**reference)

    def _decode_reference_dict(self, raw_reference: dict[str, Any]) -> dict[str, Any]:
        """把 Redis Hash 转换为参照业务字典，供 Runner 和 API 复用。"""

        legacy_latest_run_id = raw_reference.get("latest_run_id") or None
        latest_run_status = raw_reference.get("latest_run_status") or (
            "success" if legacy_latest_run_id else None
        )
        return {
            "id": raw_reference["id"],
            "name": raw_reference["name"],
            "provider": raw_reference["provider"],
            "base_url": raw_reference["base_url"],
            "api_key": raw_reference.get("api_key", ""),
            "model": raw_reference["model"],
            "prompt": raw_reference["prompt"],
            "sample_count": int(raw_reference["sample_count"]),
            "latest_run_id": legacy_latest_run_id,
            "latest_success_run_id": raw_reference.get("latest_success_run_id")
            or legacy_latest_run_id,
            "latest_run_status": latest_run_status,
            "created_at": float(raw_reference["created_at"]),
            "updated_at": float(raw_reference["updated_at"]),
        }

    def _decode_run(self, raw_run: dict[str, Any]) -> RunView:
        """把 Redis Hash 转换为运行结果视图，统一后台历史和公开曲线的数据格式。"""

        stats = json.loads(raw_run.get("stats") or "{}")
        smooth_score = float(raw_run["smooth_score"])
        public_score_override_raw = raw_run.get("public_score_override")
        public_score_override = (
            float(public_score_override_raw) if public_score_override_raw else None
        )
        public_enabled_raw = raw_run.get(
            "public_enabled",
            "1" if raw_run.get("status") == "success" else "0",
        )
        public_enabled = self._str_to_bool(public_enabled_raw)
        return RunView(
            id=raw_run["id"],
            task_id=raw_run["task_id"],
            status=raw_run["status"],
            started_at=float(raw_run["started_at"]),
            completed_at=float(raw_run["completed_at"]),
            sample_count=int(raw_run["sample_count"]),
            success_count=int(raw_run["success_count"]),
            failed_count=int(raw_run["failed_count"]),
            raw_similarity=float(raw_run["raw_similarity"]),
            display_score=float(raw_run["display_score"]),
            smooth_score=smooth_score,
            public_enabled=public_enabled,
            public_score_override=public_score_override,
            public_score=(
                public_score_override if public_score_override is not None else smooth_score
            ),
            baseline_run_id=raw_run.get("baseline_run_id") or None,
            error_summary=raw_run.get("error_summary") or None,
            stats=stats,
        )

    async def _get_effective_public_scores(self, task_id: str) -> dict[str, float]:
        """按当前任务区间配置重算公开成功运行的最终前台展示分。"""

        raw_task = await self.redis.hgetall(self._task_key(task_id))
        if not raw_task:
            return {}
        task = self._decode_task_dict(raw_task)
        run_ids = await self.redis.zrange(f"task:{task_id}:runs", 0, -1)
        public_scores: dict[str, float] = {}
        previous_public_score: float | None = None
        for run_id in run_ids:
            raw_run = await self.redis.hgetall(self._run_key(run_id))
            if not raw_run or not self._is_public_success_run(raw_run):
                continue
            score = self._calculate_effective_public_score(
                raw_run,
                task,
                previous_public_score,
            )
            public_scores[raw_run["id"]] = score
            previous_public_score = score
        return public_scores

    def _calculate_effective_public_score(
        self,
        raw_run: dict[str, Any],
        task: dict[str, Any],
        previous_public_score: float | None,
    ) -> float:
        """计算单次运行在当前任务配置下的最终前台展示分。"""

        override = raw_run.get("public_score_override")
        if override:
            override_score = float(override)
            if not task["public_score_range_enabled"] or is_score_in_public_range(
                override_score,
                task["public_score_min"],
                task["public_score_max"],
            ):
                return round(override_score, 2)

        base_score = float(raw_run["smooth_score"])
        if not task["public_score_range_enabled"]:
            return base_score
        return ranged_public_score(
            base_public_score=base_score,
            previous_public_score=previous_public_score,
            smoothing_level=task["smoothing_level"],
            run_id=raw_run["id"],
            min_score=task["public_score_min"],
            max_score=task["public_score_max"],
        )

    def _is_public_success_run(self, raw_run: dict[str, Any]) -> bool:
        """判断运行是否可参与前台展示分连续性；隐藏运行不参与。"""

        public_enabled = raw_run.get(
            "public_enabled",
            "1" if raw_run.get("status") == "success" else "0",
        )
        return raw_run.get("status") == "success" and public_enabled == "1"

    def _decode_run_job(self, raw_job: dict[str, Any]) -> RunJobView:
        """把 Redis Hash 转换为 Job 视图，统一后台轮询和行内反馈的数据格式。"""

        return RunJobView(
            id=raw_job["id"],
            kind=raw_job["kind"],
            target_id=raw_job["target_id"],
            status=raw_job["status"],
            run_id=raw_job.get("run_id") or None,
            progress_current=int(raw_job.get("progress_current") or 0),
            progress_total=int(raw_job.get("progress_total") or 0),
            success_count=int(raw_job.get("success_count") or 0),
            failed_count=int(raw_job.get("failed_count") or 0),
            message=raw_job.get("message") or None,
            error_summary=raw_job.get("error_summary") or None,
            created_at=float(raw_job["created_at"]),
            started_at=float(raw_job["started_at"]) if raw_job.get("started_at") else None,
            completed_at=float(raw_job["completed_at"]) if raw_job.get("completed_at") else None,
            updated_at=float(raw_job["updated_at"]),
        )

    def _bool_to_str(self, value: bool) -> str:
        """把布尔配置转为 Redis 友好的字符串，避免不同客户端编码不一致。"""

        return "1" if value else "0"

    def _str_to_bool(self, value: str) -> bool:
        """把 Redis 中的布尔字符串还原为业务布尔值。"""

        return value == "1"
