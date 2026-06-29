"""后台 API 测试，验证鉴权、任务脱敏和基础 CRUD 满足管理端业务边界。"""

import json
import time

import fakeredis.aioredis
import httpx

from app.config import Settings
from app.main import app, get_repository, get_runtime_settings
from app.repository import RedisRepository


async def test_admin_api_requires_token_and_hides_api_key() -> None:
    """后台接口必须要求 Token，成功创建任务后响应中不能泄露 API Key。"""

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
    app.dependency_overrides[get_repository] = lambda: repository
    app.dependency_overrides[get_runtime_settings] = lambda: settings
    try:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            denied = await client.get("/api/tasks")
            assert denied.status_code == 401

            reference = await client.post(
                "/api/references",
                headers={"Authorization": "Bearer test-token"},
                json={
                    "name": "公开参照",
                    "provider": "openai",
                    "base_url": "https://api.example.com/v1",
                    "api_key": "secret",
                    "model": "gpt-reference",
                },
            )
            assert reference.status_code == 200

            response = await client.post(
                "/api/tasks",
                headers={"Authorization": "Bearer test-token"},
                json={
                    "name": "公开任务",
                    "provider": "openai",
                    "base_url": "https://api.example.com/v1",
                    "api_key": "secret",
                    "model": "gpt-test",
                    "reference_id": reference.json()["id"],
                },
            )
            assert response.status_code == 200
            payload = response.json()
            assert "api_key" not in payload
            assert payload["name"] == "公开任务"
    finally:
        app.dependency_overrides.clear()


async def test_admin_api_lists_reference_configs_and_rejects_invalid_task_reference() -> None:
    """后台参照接口列出独立配置，创建任务时无效参照应被业务校验拒绝。"""

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
    now = time.time()
    await redis.sadd("reference:index", "reference-1")
    await redis.hset(
        "reference:reference-1",
        mapping={
            "id": "reference-1",
            "name": "参照任务",
            "provider": "openai",
            "base_url": "https://api.example.com/v1",
            "api_key": "encrypted",
            "model": "gpt-reference",
            "prompt": "number",
            "sample_count": "50",
            "latest_run_id": "run-1",
            "created_at": str(now),
            "updated_at": str(now),
        },
    )
    await redis.hset(
        "run:run-1",
        mapping={
            "id": "run-1",
            "task_id": "reference-1",
            "status": "success",
            "started_at": str(now - 1),
            "completed_at": str(now),
            "sample_count": "50",
            "success_count": "50",
            "failed_count": "0",
            "raw_similarity": "1",
            "display_score": "100",
            "smooth_score": "100",
            "baseline_run_id": "run-1",
            "error_summary": "",
            "stats": json.dumps({"mean": 1.0}),
        },
    )
    await redis.zadd("reference:reference-1:runs", {"run-1": now})

    app.dependency_overrides[get_repository] = lambda: repository
    app.dependency_overrides[get_runtime_settings] = lambda: settings
    try:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            references = await client.get(
                "/api/references",
                headers={"Authorization": "Bearer test-token"},
            )
            assert references.status_code == 200
            assert references.json()[0]["id"] == "reference-1"

            rejected = await client.post(
                "/api/tasks",
                headers={"Authorization": "Bearer test-token"},
                json={
                    "name": "无效参照任务",
                    "provider": "openai",
                    "base_url": "https://api.example.com/v1",
                    "api_key": "secret",
                    "model": "gpt-test",
                    "reference_id": "missing-reference",
                },
            )
            assert rejected.status_code == 400
    finally:
        app.dependency_overrides.clear()
