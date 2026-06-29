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
    RunView,
    TaskCreate,
    TaskUpdate,
    TaskView,
)


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
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.zadd(f"reference:{reference_id}:runs", {run.id: run.completed_at})
            pipe.hset(
                self._reference_key(reference_id),
                mapping={"latest_run_id": run.id, "updated_at": str(time.time())},
            )
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
        if not isinstance(reference, ReferenceView) or not reference.latest_run_id:
            return None
        distribution = await self.get_run_distribution(reference.latest_run_id)
        if not distribution:
            return None
        return reference.latest_run_id, distribution

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
        return runs

    async def get_run(self, run_id: str) -> RunView | None:
        """读取单次运行概要，供曲线聚合、详情查看和后台历史列表复用。"""

        raw_run = await self.redis.hgetall(self._run_key(run_id))
        if not raw_run:
            return None
        return self._decode_run(raw_run)

    async def get_run_detail(self, run_id: str) -> RunDetail | None:
        """读取单次运行详情，附带分布和原始采样以支持后台审计。"""

        run = await self.get_run(run_id)
        if run is None:
            return None
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
        return [run for run in runs if run.status == "success"]

    def _task_key(self, task_id: str) -> str:
        """生成任务 Hash key，确保所有模块使用同一 Redis 命名约定。"""

        return f"task:{task_id}"

    def _reference_key(self, reference_id: str) -> str:
        """生成参照 Hash key，确保参照配置与任务配置分开存储。"""

        return f"reference:{reference_id}"

    def _run_key(self, run_id: str) -> str:
        """生成运行 Hash key，确保运行概要和分布详情能稳定关联。"""

        return f"run:{run_id}"

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

        return {
            "id": raw_reference["id"],
            "name": raw_reference["name"],
            "provider": raw_reference["provider"],
            "base_url": raw_reference["base_url"],
            "api_key": raw_reference.get("api_key", ""),
            "model": raw_reference["model"],
            "prompt": raw_reference["prompt"],
            "sample_count": int(raw_reference["sample_count"]),
            "latest_run_id": raw_reference.get("latest_run_id") or None,
            "created_at": float(raw_reference["created_at"]),
            "updated_at": float(raw_reference["updated_at"]),
        }

    def _decode_run(self, raw_run: dict[str, Any]) -> RunView:
        """把 Redis Hash 转换为运行结果视图，统一后台历史和公开曲线的数据格式。"""

        stats = json.loads(raw_run.get("stats") or "{}")
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
            smooth_score=float(raw_run["smooth_score"]),
            baseline_run_id=raw_run.get("baseline_run_id") or None,
            error_summary=raw_run.get("error_summary") or None,
            stats=stats,
        )

    def _bool_to_str(self, value: bool) -> str:
        """把布尔配置转为 Redis 友好的字符串，避免不同客户端编码不一致。"""

        return "1" if value else "0"

    def _str_to_bool(self, value: str) -> bool:
        """把 Redis 中的布尔字符串还原为业务布尔值。"""

        return value == "1"
