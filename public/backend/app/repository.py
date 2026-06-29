"""公开 Redis 仓库层，只读取 public 索引中的脱敏任务、曲线和分布数据。"""

from __future__ import annotations

import json
import time
from typing import Any

from redis.asyncio import Redis

from app.models import PublicRunDetail, PublicTask, SeriesPoint


class PublicRepository:
    """封装公开看板的数据读取规则，避免前台 API 误触后台敏感字段。"""

    def __init__(self, redis: Redis):
        """接收 Redis 客户端，让公开 API 与后台服务读取同一份任务运行数据。"""

        self.redis = redis

    async def close(self) -> None:
        """关闭 Redis 连接，释放公开服务生命周期结束时的网络资源。"""

        await self.redis.aclose()

    async def list_public_tasks(self) -> list[PublicTask]:
        """读取公开索引中的任务摘要，用于公开首页任务卡片展示。"""

        task_ids = sorted(await self.redis.smembers("public:task:index"))
        tasks = [
            task
            for task_id in task_ids
            if (task := await self.get_public_task(task_id)) is not None
        ]
        return sorted(tasks, key=lambda task: task.updated_at, reverse=True)

    async def get_public_task(self, task_id: str) -> PublicTask | None:
        """读取单个公开任务摘要，若任务未公开或不存在则返回空。"""

        if not await self.redis.sismember("public:task:index", task_id):
            return None
        raw_task = await self.redis.hgetall(f"task:{task_id}")
        if not raw_task:
            return None
        latest_status = None
        if raw_task.get("last_run_id"):
            raw_run = await self.redis.hgetall(f"run:{raw_task['last_run_id']}")
            latest_status = raw_run.get("status") if raw_run else None
        return PublicTask(
            id=raw_task["id"],
            name=raw_task["name"],
            model=raw_task["model"],
            enabled=raw_task.get("enabled") == "1",
            last_run_id=raw_task.get("last_run_id") or None,
            last_smooth_score=float(raw_task["last_smooth_score"])
            if raw_task.get("last_smooth_score")
            else None,
            latest_status=latest_status,
            updated_at=float(raw_task.get("updated_at") or raw_task.get("created_at") or 0),
        )

    async def get_series(
        self,
        task_id: str,
        range_name: str,
    ) -> tuple[PublicTask, list[SeriesPoint]] | None:
        """按公开任务和时间范围返回评分曲线点，供 ECharts 绘制趋势图。"""

        task = await self.get_public_task(task_id)
        if task is None:
            return None
        since = time.time() - self._range_to_seconds(range_name)
        run_ids = await self.redis.zrangebyscore(f"task:{task_id}:runs", since, "+inf")
        points: list[SeriesPoint] = []
        for run_id in run_ids:
            raw_run = await self.redis.hgetall(f"run:{run_id}")
            if raw_run and raw_run.get("status") == "success":
                points.append(self._decode_series_point(raw_run))
        return task, points

    async def get_public_run_detail(self, task_id: str, run_id: str) -> PublicRunDetail | None:
        """读取公开运行详情，只返回统计和分布，隐藏后台错误与原始数字。"""

        if await self.get_public_task(task_id) is None:
            return None
        raw_run = await self.redis.hgetall(f"run:{run_id}")
        if not raw_run or raw_run.get("task_id") != task_id:
            return None
        distribution_raw = await self.redis.get(f"run:{run_id}:dist")
        stats = json.loads(raw_run.get("stats") or "{}")
        return PublicRunDetail(
            id=raw_run["id"],
            task_id=raw_run["task_id"],
            completed_at=float(raw_run["completed_at"]),
            display_score=float(raw_run["display_score"]),
            smooth_score=float(raw_run["smooth_score"]),
            success_count=int(raw_run["success_count"]),
            failed_count=int(raw_run["failed_count"]),
            stats=stats,
            distribution=json.loads(distribution_raw) if distribution_raw else [],
        )

    def _decode_series_point(self, raw_run: dict[str, Any]) -> SeriesPoint:
        """把 Redis run 字段转成公开曲线点，统一前台趋势图的数据格式。"""

        return SeriesPoint(
            run_id=raw_run["id"],
            completed_at=float(raw_run["completed_at"]),
            display_score=float(raw_run["display_score"]),
            smooth_score=float(raw_run["smooth_score"]),
            success_count=int(raw_run["success_count"]),
            failed_count=int(raw_run["failed_count"]),
        )

    def _range_to_seconds(self, range_name: str) -> int:
        """将前台传入的时间范围映射为秒数，限制公开 API 的查询窗口。"""

        ranges = {"1h": 3600, "24h": 86400, "7d": 604800, "30d": 2592000}
        return ranges.get(range_name, ranges["24h"])
