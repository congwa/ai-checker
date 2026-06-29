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
            "last_run_id": "run-1",
            "last_smooth_score": "98.5",
            "updated_at": str(now),
        },
    )
    await redis.hset(
        "run:run-1",
        mapping={
            "id": "run-1",
            "task_id": "task-1",
            "status": "success",
            "completed_at": str(now),
            "display_score": "99.0",
            "smooth_score": "98.5",
            "success_count": "50",
            "failed_count": "0",
            "stats": json.dumps({"mean": 120.0}),
        },
    )
    await redis.zadd("task:task-1:runs", {"run-1": now})
    await redis.set("run:run-1:dist", json.dumps([1.0] + [0.0] * 354))

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

            detail = await client.get("/api/tasks/task-1/runs/run-1")
            assert detail.status_code == 200
            detail_payload = detail.json()
            assert detail_payload["distribution"][0] == 1.0
            assert "error_summary" not in detail_payload
    finally:
        app.dependency_overrides.clear()

