"""后台 API 测试，验证鉴权、任务脱敏和基础 CRUD 满足管理端业务边界。"""

import json
import time

import fakeredis.aioredis
import httpx
import pytest

from app.config import Settings
from app.main import app, get_repository, get_runtime_settings
from app.models import RunView
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
            reference_id = reference.json()["id"]
            await redis.hset(
                f"reference:{reference_id}",
                mapping={"latest_success_run_id": "run-reference", "latest_run_status": "success"},
            )

            response = await client.post(
                "/api/tasks",
                headers={"Authorization": "Bearer test-token"},
                json={
                    "name": "公开任务",
                    "provider": "openai",
                    "base_url": "https://api.example.com/v1",
                    "api_key": "secret",
                    "model": "gpt-test",
                    "reference_id": reference_id,
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
            "latest_success_run_id": "run-1",
            "latest_run_status": "success",
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

            accepted = await client.post(
                "/api/tasks",
                headers={"Authorization": "Bearer test-token"},
                json={
                    "name": "继承参照协议任务",
                    "provider": "openai",
                    "base_url": "https://api.example.com/v1",
                    "api_key": "secret",
                    "model": "gpt-test",
                    "reference_id": "reference-1",
                },
            )
            assert accepted.status_code == 200
            assert accepted.json()["prompt"] == "number"
            assert accepted.json()["sample_count"] == 50

            mismatch = await client.post(
                "/api/tasks",
                headers={"Authorization": "Bearer test-token"},
                json={
                    "name": "题目不一致任务",
                    "provider": "openai",
                    "base_url": "https://api.example.com/v1",
                    "api_key": "secret",
                    "model": "gpt-test",
                    "reference_id": "reference-1",
                    "prompt": "different question",
                },
            )
            assert mismatch.status_code == 400
            assert (
                mismatch.json()["detail"]
                == "任务题目必须与所选参照一致；请修改参照或选择匹配参照"
            )

            sample_count_mismatch = await client.post(
                "/api/tasks",
                headers={"Authorization": "Bearer test-token"},
                json={
                    "name": "次数不一致任务",
                    "provider": "openai",
                    "base_url": "https://api.example.com/v1",
                    "api_key": "secret",
                    "model": "gpt-test",
                    "reference_id": "reference-1",
                    "sample_count": 10,
                },
            )
            assert sample_count_mismatch.status_code == 400
            assert (
                sample_count_mismatch.json()["detail"]
                == "任务采样次数必须与所选参照一致；请修改参照或选择匹配参照"
            )

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


async def test_admin_api_rejects_uncalibrated_reference_when_creating_task() -> None:
    """任务必须选择已成功标定的参照，避免后台保存后运行时才暴露基准缺失。"""

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
            reference = await client.post(
                "/api/references",
                headers={"Authorization": "Bearer test-token"},
                json={
                    "name": "未标定参照",
                    "provider": "openai",
                    "base_url": "https://api.example.com/v1",
                    "api_key": "secret",
                    "model": "gpt-reference",
                },
            )
            rejected = await client.post(
                "/api/tasks",
                headers={"Authorization": "Bearer test-token"},
                json={
                    "name": "等待基准任务",
                    "provider": "openai",
                    "base_url": "https://api.example.com/v1",
                    "api_key": "secret",
                    "model": "gpt-test",
                    "reference_id": reference.json()["id"],
                },
            )
            assert rejected.status_code == 400
            assert rejected.json()["detail"] == "请先成功运行参照，再把它作为任务基准"
    finally:
        app.dependency_overrides.clear()


async def test_admin_api_reference_run_job_reports_terminal_status(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """参照 Job 接口应立即返回可轮询状态，并在后台完成后保留成功结果。"""

    class FakeTaskRunner:
        """测试替身 Runner，用固定采样结果验证 Job 状态流转而不访问外部模型。"""

        def __init__(self, repository: RedisRepository, settings: Settings, progress_reporter=None):
            """保存仓库和进度回调，让假运行也能模拟真实后台采样反馈。"""

            self.repository = repository
            self.progress_reporter = progress_reporter

        async def run_reference(self, reference_id: str) -> RunView:
            """模拟一次成功参照标定，并把结果写入仓库供接口轮询读取。"""

            if self.progress_reporter is not None:
                await self.progress_reporter(10, 10, 10, 0)
            run = RunView(
                id="run-job-success",
                task_id=reference_id,
                status="success",
                started_at=1.0,
                completed_at=2.0,
                sample_count=10,
                success_count=10,
                failed_count=0,
                raw_similarity=1.0,
                display_score=100.0,
                smooth_score=100.0,
                baseline_run_id="run-job-success",
                stats={"mean": 1.0},
            )
            await self.repository.save_reference_run(
                reference_id,
                run,
                [1.0] + [0.0] * 354,
                [1] * 10,
            )
            return run

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
    monkeypatch.setattr("app.main.TaskRunner", FakeTaskRunner)
    app.dependency_overrides[get_repository] = lambda: repository
    app.dependency_overrides[get_runtime_settings] = lambda: settings
    try:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            reference = await client.post(
                "/api/references",
                headers={"Authorization": "Bearer test-token"},
                json={
                    "name": "Job 参照",
                    "provider": "openai",
                    "base_url": "https://api.example.com/v1",
                    "api_key": "secret",
                    "model": "gpt-reference",
                    "sample_count": 10,
                },
            )
            response = await client.post(
                f"/api/references/{reference.json()['id']}/run-jobs",
                headers={"Authorization": "Bearer test-token"},
            )
            assert response.status_code == 200
            job_id = response.json()["id"]

            job = await client.get(
                f"/api/run-jobs/{job_id}",
                headers={"Authorization": "Bearer test-token"},
            )
            assert job.status_code == 200
            assert job.json()["status"] == "success"
            assert job.json()["run_id"] == "run-job-success"
            assert job.json()["progress_current"] == 10

            active_jobs = await client.get(
                "/api/run-jobs/active",
                headers={"Authorization": "Bearer test-token"},
            )
            assert active_jobs.json() == []
    finally:
        app.dependency_overrides.clear()
