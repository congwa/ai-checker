"""公开 API 测试，验证前台接口只返回脱敏任务、曲线和分布数据。"""

import json
import time

import fakeredis.aioredis
import httpx

from app.main import app, get_repository
from app.repository import PublicRepository


async def test_public_api_returns_only_public_sanitized_data() -> None:
    """公开概览必须隐藏 baseurl 和 API Key，只暴露任务名、模型名和评分状态。"""

    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    now = time.time()
    await redis.sadd("public:task:index", "task-1")
    await redis.hset(
        "task:task-1",
        mapping={
            "id": "task-1",
            "name": "公开模型",
            "model": "gpt-test",
            "base_url": "https://secret.example.com/v1",
            "api_key": "encrypted",
            "enabled": "1",
            "last_run_id": "run-hidden",
            "last_smooth_score": "99.99",
            "updated_at": str(now),
        },
    )
    await redis.hset(
        "task:task-private",
        mapping={
            "id": "task-private",
            "name": "私有模型",
            "model": "gpt-private",
            "base_url": "https://secret.example.com/v1",
            "api_key": "encrypted",
            "enabled": "1",
            "last_run_id": "",
            "last_smooth_score": "",
            "updated_at": str(now),
        },
    )
    await redis.hset(
        "run:run-1",
        mapping={
            "id": "run-1",
            "task_id": "task-1",
            "status": "success",
            "completed_at": str(now - 10),
            "display_score": "99.0",
            "smooth_score": "98.5",
            "public_enabled": "1",
            "public_score_override": "87.25",
            "success_count": "50",
            "failed_count": "0",
            "stats": json.dumps({"mean": 120.0}),
        },
    )
    await redis.hset(
        "run:run-hidden",
        mapping={
            "id": "run-hidden",
            "task_id": "task-1",
            "status": "success",
            "completed_at": str(now),
            "display_score": "99.99",
            "smooth_score": "99.99",
            "public_enabled": "0",
            "public_score_override": "",
            "success_count": "50",
            "failed_count": "0",
            "stats": json.dumps({"mean": 130.0}),
        },
    )
    await redis.zadd("task:task-1:runs", {"run-1": now - 10, "run-hidden": now})
    await redis.set("run:run-1:dist", json.dumps([1.0] + [0.0] * 354))
    await redis.set("run:run-hidden:dist", json.dumps([0.0, 1.0] + [0.0] * 353))

    app.dependency_overrides[get_repository] = lambda: PublicRepository(redis)
    try:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            overview = await client.get("/api/overview")
            assert overview.status_code == 200
            task_payload = overview.json()["tasks"][0]
            assert task_payload["name"] == "公开模型"
            assert "api_key" not in task_payload
            assert "base_url" not in task_payload
            assert task_payload["last_run_id"] == "run-1"
            assert task_payload["last_smooth_score"] == 87.25
            assert [task["id"] for task in overview.json()["tasks"]] == ["task-1"]

            series = await client.get("/api/tasks/task-1/series")
            assert series.status_code == 200
            assert [point["run_id"] for point in series.json()["points"]] == ["run-1"]
            assert series.json()["points"][0]["smooth_score"] == 87.25
            assert series.json()["points"][0]["display_score"] == 87.25

            detail = await client.get("/api/tasks/task-1/runs/run-1")
            assert detail.status_code == 200
            detail_payload = detail.json()
            assert detail_payload["distribution"][0] == 1.0
            assert detail_payload["smooth_score"] == 87.25
            assert detail_payload["display_score"] == 87.25
            assert "error_summary" not in detail_payload

            hidden_detail = await client.get("/api/tasks/task-1/runs/run-hidden")
            assert hidden_detail.status_code == 404
    finally:
        app.dependency_overrides.clear()


async def test_public_api_recalculates_history_with_task_score_range() -> None:
    """公开概览、曲线和详情应按当前任务显示分区间动态返回最终分。"""

    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    now = time.time()
    await redis.sadd("public:task:index", "task-range")
    await redis.hset(
        "task:task-range",
        mapping={
            "id": "task-range",
            "name": "区间模型",
            "model": "gpt-range",
            "enabled": "1",
            "last_run_id": "run-range-3",
            "last_smooth_score": "100",
            "smoothing_level": "65",
            "public_score_range_enabled": "1",
            "public_score_min": "90",
            "public_score_max": "95",
            "updated_at": str(now),
        },
    )
    for index, score in enumerate([85.0, 90.0, 100.0], start=1):
        await redis.hset(
            f"run:run-range-{index}",
            mapping={
                "id": f"run-range-{index}",
                "task_id": "task-range",
                "status": "success",
                "completed_at": str(now - 30 + index),
                "display_score": str(score),
                "smooth_score": str(score),
                "public_enabled": "1",
                "public_score_override": "99" if index == 3 else "",
                "success_count": "50",
                "failed_count": "0",
                "stats": json.dumps({"mean": 120.0 + index}),
            },
        )
        await redis.set(f"run:run-range-{index}:dist", json.dumps([1.0] + [0.0] * 354))
    await redis.zadd(
        "task:task-range:runs",
        {
            "run-range-1": now - 29,
            "run-range-2": now - 28,
            "run-range-3": now - 27,
        },
    )

    app.dependency_overrides[get_repository] = lambda: PublicRepository(redis)
    try:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            overview = await client.get("/api/overview")
            assert overview.status_code == 200
            latest_score = overview.json()["tasks"][0]["last_smooth_score"]
            assert 90.0 <= latest_score <= 95.0
            assert latest_score != 95.0

            series = await client.get("/api/tasks/task-range/series")
            assert series.status_code == 200
            points = series.json()["points"]
            assert [point["run_id"] for point in points] == [
                "run-range-1",
                "run-range-2",
                "run-range-3",
            ]
            assert all(90.0 <= point["smooth_score"] <= 95.0 for point in points)
            assert points[-1]["smooth_score"] != 99.0

            detail = await client.get("/api/tasks/task-range/runs/run-range-3")
            assert detail.status_code == 200
            assert 90.0 <= detail.json()["smooth_score"] <= 95.0
            assert detail.json()["display_score"] == detail.json()["smooth_score"]
    finally:
        app.dependency_overrides.clear()
