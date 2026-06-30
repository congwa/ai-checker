"""公开 Redis 仓库层，只读取 public 索引中的脱敏任务、曲线和分布数据。"""

from __future__ import annotations

import hashlib
import json
import time
from typing import Any

from redis.asyncio import Redis

from app.models import PublicRunDetail, PublicTask, SeriesPoint

MIN_PUBLIC_SCORE = 85.0
MAX_PUBLIC_SCORE = 100.0
MIN_SCORE_RANGE_WIDTH = 5.0


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
        scored_runs = await self._get_public_scored_runs(raw_task, task_id)
        latest = scored_runs[-1] if scored_runs else None
        if latest is None and raw_task.get("last_run_id"):
            raw_latest_run = await self.redis.hgetall(f"run:{raw_task['last_run_id']}")
            if raw_latest_run and self._is_public_success_run(raw_latest_run):
                latest = (
                    raw_latest_run,
                    self._calculate_effective_public_score(raw_task, raw_latest_run, None),
                )
        return PublicTask(
            id=raw_task["id"],
            name=raw_task["name"],
            model=raw_task["model"],
            enabled=raw_task.get("enabled") == "1",
            last_run_id=latest[0]["id"] if latest else None,
            last_smooth_score=latest[1] if latest else None,
            latest_status=latest[0].get("status") if latest else None,
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
        points: list[SeriesPoint] = []
        raw_task = await self.redis.hgetall(f"task:{task_id}")
        for raw_run, public_score in await self._get_public_scored_runs(raw_task, task_id):
            if float(raw_run["completed_at"]) >= since:
                points.append(self._decode_series_point(raw_run, public_score))
        return task, points

    async def get_public_run_detail(self, task_id: str, run_id: str) -> PublicRunDetail | None:
        """读取公开运行详情，只返回统计和分布，隐藏后台错误与原始数字。"""

        if await self.get_public_task(task_id) is None:
            return None
        raw_run = await self.redis.hgetall(f"run:{run_id}")
        if not raw_run or raw_run.get("task_id") != task_id:
            return None
        if not self._is_public_success_run(raw_run):
            return None
        distribution_raw = await self.redis.get(f"run:{run_id}:dist")
        stats = json.loads(raw_run.get("stats") or "{}")
        raw_task = await self.redis.hgetall(f"task:{task_id}")
        score_map = {
            scored_run["id"]: score
            for scored_run, score in await self._get_public_scored_runs(raw_task, task_id)
        }
        public_score = score_map.get(
            run_id,
            self._calculate_effective_public_score(raw_task, raw_run, None),
        )
        return PublicRunDetail(
            id=raw_run["id"],
            task_id=raw_run["task_id"],
            completed_at=float(raw_run["completed_at"]),
            display_score=public_score,
            smooth_score=public_score,
            success_count=int(raw_run["success_count"]),
            failed_count=int(raw_run["failed_count"]),
            stats=stats,
            distribution=json.loads(distribution_raw) if distribution_raw else [],
        )

    def _decode_series_point(
        self,
        raw_run: dict[str, Any],
        public_score: float,
    ) -> SeriesPoint:
        """把 Redis run 字段转成公开曲线点，统一前台趋势图的数据格式。"""

        return SeriesPoint(
            run_id=raw_run["id"],
            completed_at=float(raw_run["completed_at"]),
            display_score=public_score,
            smooth_score=public_score,
            success_count=int(raw_run["success_count"]),
            failed_count=int(raw_run["failed_count"]),
        )

    async def _get_public_scored_runs(
        self,
        raw_task: dict[str, Any],
        task_id: str,
    ) -> list[tuple[dict[str, Any], float]]:
        """按当前渠道区间配置重算公开成功运行的最终展示分。"""

        run_ids = await self.redis.zrevrange(f"task:{task_id}:runs", 0, -1)
        chronological_ids = list(reversed(run_ids))
        scored_runs: list[tuple[dict[str, Any], float]] = []
        previous_public_score: float | None = None
        for run_id in chronological_ids:
            raw_run = await self.redis.hgetall(f"run:{run_id}")
            if not raw_run or not self._is_public_success_run(raw_run):
                continue
            public_score = self._calculate_effective_public_score(
                raw_task,
                raw_run,
                previous_public_score,
            )
            scored_runs.append((raw_run, public_score))
            previous_public_score = public_score
        return scored_runs

    async def _get_latest_public_run(self, task_id: str) -> dict[str, Any] | None:
        """读取最近一次公开成功运行，避免隐藏结果继续影响公开摘要卡片。"""

        run_ids = await self.redis.zrevrange(f"task:{task_id}:runs", 0, -1)
        for run_id in run_ids:
            raw_run = await self.redis.hgetall(f"run:{run_id}")
            if raw_run and self._is_public_success_run(raw_run):
                return raw_run
        return None

    def _is_public_success_run(self, raw_run: dict[str, Any]) -> bool:
        """判断运行是否允许出现在公开看板；老成功记录默认继续公开。"""

        public_enabled = raw_run.get(
            "public_enabled",
            "1" if raw_run.get("status") == "success" else "0",
        )
        return raw_run.get("status") == "success" and public_enabled == "1"

    def _calculate_effective_public_score(
        self,
        raw_task: dict[str, Any],
        raw_run: dict[str, Any],
        previous_public_score: float | None,
    ) -> float:
        """读取公开展示分，优先使用合法覆盖分，否则应用渠道区间算法。"""

        score_override = raw_run.get("public_score_override")
        if score_override:
            override = float(score_override)
            if not self._range_enabled(raw_task) or self._score_in_range(
                override,
                self._range_min(raw_task),
                self._range_max(raw_task),
            ):
                return round(override, 2)

        base_score = float(raw_run["smooth_score"])
        if not self._range_enabled(raw_task):
            return base_score
        return self._ranged_public_score(
            base_public_score=base_score,
            previous_public_score=previous_public_score,
            smoothing_level=int(raw_task.get("smoothing_level") or 65),
            run_id=raw_run["id"],
            min_score=self._range_min(raw_task),
            max_score=self._range_max(raw_task),
        )

    def _ranged_public_score(
        self,
        base_public_score: float,
        previous_public_score: float | None,
        smoothing_level: int,
        run_id: str,
        min_score: float,
        max_score: float,
    ) -> float:
        """把系统前台分软压缩到渠道区间内，公开端保持可复现。"""

        normalized_min, normalized_max = self._validate_score_range(min_score, max_score)
        width = normalized_max - normalized_min
        edge_padding = min(1.2, width * 0.08)
        inner_min = normalized_min + edge_padding
        inner_max = normalized_max - edge_padding
        if inner_min >= inner_max:
            inner_min = normalized_min
            inner_max = normalized_max

        normalized_score = self._clamp(
            (self._clamp(base_public_score, MIN_PUBLIC_SCORE, MAX_PUBLIC_SCORE)
             - MIN_PUBLIC_SCORE)
            / (MAX_PUBLIC_SCORE - MIN_PUBLIC_SCORE),
            0.0,
            1.0,
        )
        softened_ratio = normalized_score * normalized_score * (3 - 2 * normalized_score)
        compressed = inner_min + softened_ratio * (inner_max - inner_min)

        if previous_public_score is not None:
            normalized_smoothing = self._clamp(float(smoothing_level), 0.0, 100.0)
            alpha = max(0.12, 1 - normalized_smoothing / 100)
            previous = self._clamp(previous_public_score, normalized_min, normalized_max)
            compressed = alpha * compressed + (1 - alpha) * previous

        compressed += self._stable_score_jitter(run_id, width)
        return round(self._clamp(compressed, normalized_min, normalized_max), 2)

    def _range_enabled(self, raw_task: dict[str, Any]) -> bool:
        """读取任务是否启用前台显示分区间，兼容老任务缺字段。"""

        return raw_task.get("public_score_range_enabled", "0") == "1"

    def _range_min(self, raw_task: dict[str, Any]) -> float:
        """读取任务前台显示最低分，兼容老任务缺字段。"""

        return float(raw_task.get("public_score_min") or 85.0)

    def _range_max(self, raw_task: dict[str, Any]) -> float:
        """读取任务前台显示最高分，兼容老任务缺字段。"""

        return float(raw_task.get("public_score_max") or 100.0)

    def _score_in_range(self, score: float, min_score: float, max_score: float) -> bool:
        """判断手动覆盖分是否可在当前渠道区间内生效。"""

        normalized_min, normalized_max = self._validate_score_range(min_score, max_score)
        return normalized_min <= float(score) <= normalized_max

    def _validate_score_range(self, min_score: float, max_score: float) -> tuple[float, float]:
        """校验公开端读取到的渠道显示区间，异常配置回退到默认区间。"""

        normalized_min = float(min_score)
        normalized_max = float(max_score)
        if (
            0.0 <= normalized_min < normalized_max <= MAX_PUBLIC_SCORE
            and normalized_max - normalized_min >= MIN_SCORE_RANGE_WIDTH
        ):
            return normalized_min, normalized_max
        return 85.0, 100.0

    def _stable_score_jitter(self, run_id: str, width: float) -> float:
        """用运行 ID 生成稳定微扰，避免连续点完全重叠但不引入随机性。"""

        digest = hashlib.sha256(run_id.encode("utf-8")).hexdigest()
        unit = int(digest[:8], 16) / 0xFFFFFFFF
        amplitude = min(0.18, width * 0.02)
        return (unit - 0.5) * 2 * amplitude

    def _clamp(self, value: float, lower: float, upper: float) -> float:
        """把数值限制在指定区间。"""

        return max(lower, min(upper, value))

    def _range_to_seconds(self, range_name: str) -> int:
        """将前台传入的时间范围映射为秒数，限制公开 API 的查询窗口。"""

        ranges = {"1h": 3600, "24h": 86400, "7d": 604800, "30d": 2592000}
        return ranges.get(range_name, ranges["24h"])
