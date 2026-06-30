"""Redis 仓库测试，验证任务、运行、公开索引和调度锁的业务存储语义。"""

import fakeredis.aioredis

from app.config import DEFAULT_PROMPT
from app.models import ReferenceCreate, RunView, TaskCreate, TaskUpdate
from app.repository import RedisRepository


async def test_repository_create_update_and_lock_roundtrip() -> None:
    """任务创建、公开索引、配置更新和锁互斥必须在同一 Redis key 规范下工作。"""

    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    repository = RedisRepository(redis)
    reference = await repository.create_reference(
        ReferenceCreate(
            name="GPT 参照",
            base_url="https://api.example.com/v1",
            api_key="secret",
            model="gpt-reference",
        ),
        encrypted_api_key="encrypted",
    )
    task = await repository.create_task(
        TaskCreate(
            name="GPT 监控",
            base_url="https://api.example.com/v1",
            api_key="secret",
            model="gpt-test",
            reference_id=reference.id,
        ),
        encrypted_api_key="encrypted",
    )
    assert task.public_enabled is True
    assert task.prompt == DEFAULT_PROMPT
    assert task.id in await redis.smembers("public:task:index")

    updated = await repository.update_task(
        task.id,
        TaskUpdate(public_enabled=False, smoothing_level=80),
        encrypted_api_key=None,
    )
    assert updated is not None
    assert updated.public_enabled is False
    assert updated.smoothing_level == 80
    assert task.id not in await redis.smembers("public:task:index")

    assert await repository.acquire_task_lock(task.id, "owner") is True
    assert await repository.acquire_task_lock(task.id, "other") is False
    await repository.release_task_lock(task.id, "owner")
    assert await repository.acquire_task_lock(task.id, "other") is True


async def test_repository_reference_run_and_task_selection_roundtrip() -> None:
    """参照配置、参照运行和任务选择必须可被后续评分流程复用。"""

    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    repository = RedisRepository(redis)
    reference = await repository.create_reference(
        ReferenceCreate(
            name="基准参照",
            base_url="https://api.example.com/v1",
            api_key="secret",
            model="gpt-test",
        ),
        encrypted_api_key="encrypted",
    )
    run = RunView(
        id="run-1",
        task_id=reference.id,
        status="success",
        started_at=1.0,
        completed_at=2.0,
        sample_count=10,
        success_count=10,
        failed_count=0,
        raw_similarity=1.0,
        display_score=100.0,
        smooth_score=100.0,
        baseline_run_id="run-1",
        stats={"mean": 1.0},
    )
    await repository.save_reference_run(reference.id, run, [1.0] + [0.0] * 354, [1] * 10)

    latest_reference = await repository.get_reference(reference.id)
    assert latest_reference.latest_run_id == run.id
    assert latest_reference.latest_success_run_id == run.id
    assert latest_reference.latest_run_status == "success"
    assert await repository.get_run_distribution(run.id) == [1.0] + [0.0] * 354

    reference_history = await repository.list_reference_history(reference.id)
    assert reference_history[0].id == run.id
    assert reference_history[0].task_id == reference.id

    latest_distribution = await repository.get_reference_latest_distribution(reference.id)
    assert latest_distribution is not None
    assert latest_distribution[0] == run.id

    child_task = await repository.create_task(
        TaskCreate(
            name="选择参照的任务",
            base_url="https://api.example.com/v1",
            api_key="secret",
            model="gpt-child",
            reference_id=reference.id,
        ),
        encrypted_api_key="encrypted",
    )
    assert child_task.reference_id == reference.id


async def test_repository_failed_reference_run_does_not_replace_success_baseline() -> None:
    """参照失败运行只能作为诊断历史，不能覆盖上一次可用于评分的成功基准。"""

    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    repository = RedisRepository(redis)
    reference = await repository.create_reference(
        ReferenceCreate(
            name="基准参照",
            base_url="https://api.example.com/v1",
            api_key="secret",
            model="gpt-test",
        ),
        encrypted_api_key="encrypted",
    )
    success_run = RunView(
        id="run-success",
        task_id=reference.id,
        status="success",
        started_at=1.0,
        completed_at=2.0,
        sample_count=10,
        success_count=10,
        failed_count=0,
        raw_similarity=1.0,
        display_score=100.0,
        smooth_score=100.0,
        baseline_run_id="run-success",
        stats={"mean": 1.0},
    )
    failed_run = RunView(
        id="run-failed",
        task_id=reference.id,
        status="failed",
        started_at=3.0,
        completed_at=4.0,
        sample_count=10,
        success_count=1,
        failed_count=9,
        raw_similarity=0.0,
        display_score=90.0,
        smooth_score=90.0,
        baseline_run_id=None,
        error_summary="有效采样少于 10 个",
        stats={"mean": 1.0},
    )

    await repository.save_reference_run(reference.id, success_run, [1.0] + [0.0] * 354, [1] * 10)
    await repository.save_reference_run(reference.id, failed_run, [1.0] + [0.0] * 354, [1])

    latest_reference = await repository.get_reference(reference.id)
    assert latest_reference.latest_run_id == failed_run.id
    assert latest_reference.latest_run_status == "failed"
    assert latest_reference.latest_success_run_id == success_run.id

    latest_distribution = await repository.get_reference_latest_distribution(reference.id)
    assert latest_distribution is not None
    assert latest_distribution[0] == success_run.id


async def test_repository_run_job_lifecycle_reuses_active_job() -> None:
    """同一目标在排队或运行时应复用 active Job，完成后才允许创建新的运行。"""

    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    repository = RedisRepository(redis)

    first_job, first_created = await repository.create_or_get_run_job(
        "reference",
        "reference-1",
        50,
        "参照运行已排队",
    )
    second_job, second_created = await repository.create_or_get_run_job(
        "reference",
        "reference-1",
        50,
        "参照运行已排队",
    )

    assert first_created is True
    assert second_created is False
    assert second_job.id == first_job.id
    assert [job.id for job in await repository.list_active_run_jobs()] == [first_job.id]

    await repository.start_run_job(first_job.id, "参照正在采样")
    await repository.update_run_job_progress(first_job.id, 25, 50, 24, 1, "参照采样中：25/50")
    running_job = await repository.get_run_job(first_job.id)
    assert running_job.status == "running"
    assert running_job.progress_current == 25
    assert running_job.success_count == 24
    assert running_job.failed_count == 1

    await repository.finish_run_job(first_job.id, "success", "run-1", 49, 1, "参照标定完成")
    assert await repository.list_active_run_jobs() == []

    third_job, third_created = await repository.create_or_get_run_job(
        "reference",
        "reference-1",
        50,
        "参照运行已排队",
    )
    assert third_created is True
    assert third_job.id != first_job.id
