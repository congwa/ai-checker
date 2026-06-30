"""后台管理 FastAPI 入口，提供参照配置、任务配置、运行触发和运行历史接口。"""

from __future__ import annotations

import secrets
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis

from app.config import Settings, get_settings
from app.models import (
    ReferenceCreate,
    ReferenceUpdate,
    ReferenceView,
    RunDetail,
    RunJobView,
    RunView,
    TaskCreate,
    TaskUpdate,
    TaskView,
)
from app.repository import RedisRepository
from app.runner import TaskRunner
from app.security import encrypt_api_key


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """管理后台服务生命周期，启动时连接 Redis，关闭时释放连接。"""

    settings = get_settings()
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    app.state.settings = settings
    app.state.repository = RedisRepository(redis)
    try:
        yield
    finally:
        await app.state.repository.close()


app = FastAPI(title="AI Checker Admin API", version="0.1.0", lifespan=lifespan)
settings_for_cors = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings_for_cors.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_repository() -> RedisRepository:
    """向接口注入 Redis 仓库，使路由只表达后台业务行为而不关心连接细节。"""

    return app.state.repository


def get_runtime_settings() -> Settings:
    """向接口注入运行配置，用于鉴权、加密和手动运行任务。"""

    return app.state.settings


def require_admin(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_runtime_settings),
) -> None:
    """校验后台 Bearer Token，防止公开用户操作任务配置或读取敏感诊断信息。"""

    expected = f"Bearer {settings.admin_token}"
    if authorization is None or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="后台 Token 无效")


@app.get("/health")
async def health() -> dict[str, str]:
    """返回后台 API 健康状态，供本地联调和部署探针确认服务可用。"""

    return {"status": "ok"}


@app.post("/api/tasks", response_model=TaskView, dependencies=[Depends(require_admin)])
async def create_task(
    payload: TaskCreate,
    repository: RedisRepository = Depends(get_repository),
    settings: Settings = Depends(get_runtime_settings),
) -> TaskView:
    """创建新的 AI 监控任务，并校验用户显式选择的参照基准。"""

    await _validate_reference(repository, payload.reference_id)
    encrypted_api_key = encrypt_api_key(payload.api_key, settings.secret_key)
    return await repository.create_task(payload, encrypted_api_key)


@app.get("/api/tasks", response_model=list[TaskView], dependencies=[Depends(require_admin)])
async def list_tasks(repository: RedisRepository = Depends(get_repository)) -> list[TaskView]:
    """列出全部后台任务，供管理工作台呈现任务状态和评分摘要。"""

    return await repository.list_tasks()


@app.post("/api/references", response_model=ReferenceView, dependencies=[Depends(require_admin)])
async def create_reference(
    payload: ReferenceCreate,
    repository: RedisRepository = Depends(get_repository),
    settings: Settings = Depends(get_runtime_settings),
) -> ReferenceView:
    """创建独立参照配置，后续可单独运行标定并被任务选择。"""

    encrypted_api_key = encrypt_api_key(payload.api_key, settings.secret_key)
    return await repository.create_reference(payload, encrypted_api_key)


@app.get(
    "/api/references",
    response_model=list[ReferenceView],
    dependencies=[Depends(require_admin)],
)
async def list_references(
    repository: RedisRepository = Depends(get_repository),
) -> list[ReferenceView]:
    """列出全部参照配置，供后台添加任务时选择比较基准。"""

    return await repository.list_references()


@app.patch(
    "/api/references/{reference_id}",
    response_model=ReferenceView,
    dependencies=[Depends(require_admin)],
)
async def update_reference(
    reference_id: str,
    payload: ReferenceUpdate,
    repository: RedisRepository = Depends(get_repository),
    settings: Settings = Depends(get_runtime_settings),
) -> ReferenceView:
    """更新参照配置；API Key 为空时保留原密钥。"""

    encrypted_api_key = (
        encrypt_api_key(payload.api_key, settings.secret_key) if payload.api_key else None
    )
    reference = await repository.update_reference(reference_id, payload, encrypted_api_key)
    if reference is None:
        raise HTTPException(status_code=404, detail="参照不存在")
    return reference


@app.delete("/api/references/{reference_id}", dependencies=[Depends(require_admin)])
async def delete_reference(
    reference_id: str,
    repository: RedisRepository = Depends(get_repository),
) -> dict[str, bool]:
    """删除不再使用的参照配置，历史标定数据保留用于审计。"""

    deleted = await repository.delete_reference(reference_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="参照不存在")
    return {"deleted": True}


@app.post(
    "/api/references/{reference_id}/run",
    response_model=RunView,
    dependencies=[Depends(require_admin)],
)
async def run_reference(
    reference_id: str,
    repository: RedisRepository = Depends(get_repository),
    settings: Settings = Depends(get_runtime_settings),
) -> RunView:
    """手动运行参照标定，生成任务比较所需的最新基准分布。"""

    runner = TaskRunner(repository, settings)
    try:
        return await runner.run_reference(reference_id)
    except RuntimeError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.post(
    "/api/references/{reference_id}/run-jobs",
    response_model=RunJobView,
    dependencies=[Depends(require_admin)],
)
async def create_reference_run_job(
    reference_id: str,
    background_tasks: BackgroundTasks,
    repository: RedisRepository = Depends(get_repository),
    settings: Settings = Depends(get_runtime_settings),
) -> RunJobView:
    """创建参照标定后台 Job，让页面立即反馈已接收并通过轮询查看进度。"""

    reference = await repository.get_reference(reference_id)
    if not isinstance(reference, ReferenceView):
        raise HTTPException(status_code=404, detail="参照不存在")
    job, created = await repository.create_or_get_run_job(
        "reference",
        reference_id,
        reference.sample_count,
        "参照运行已排队，等待后台开始采样",
    )
    if created:
        background_tasks.add_task(_run_reference_job, job.id, reference_id, repository, settings)
    return job


@app.get(
    "/api/run-jobs/active",
    response_model=list[RunJobView],
    dependencies=[Depends(require_admin)],
)
async def list_active_run_jobs(
    repository: RedisRepository = Depends(get_repository),
) -> list[RunJobView]:
    """列出页面刷新后仍需继续展示等待态的后台运行 Job。"""

    return await repository.list_active_run_jobs()


@app.get(
    "/api/run-jobs/{job_id}",
    response_model=RunJobView,
    dependencies=[Depends(require_admin)],
)
async def get_run_job(
    job_id: str,
    repository: RedisRepository = Depends(get_repository),
) -> RunJobView:
    """读取单个后台运行 Job，支撑前端轮询展示进度和最终错误。"""

    job = await repository.get_run_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="运行任务不存在")
    return job


@app.get(
    "/api/references/{reference_id}/runs",
    response_model=list[RunView],
    dependencies=[Depends(require_admin)],
)
async def list_reference_runs(
    reference_id: str,
    repository: RedisRepository = Depends(get_repository),
) -> list[RunView]:
    """读取参照标定历史，供后台确认参照是否已成功生成分布。"""

    reference = await repository.get_reference(reference_id)
    if not isinstance(reference, ReferenceView):
        raise HTTPException(status_code=404, detail="参照不存在")
    return await repository.list_reference_history(reference_id)


@app.get("/api/tasks/{task_id}", response_model=TaskView, dependencies=[Depends(require_admin)])
async def get_task(task_id: str, repository: RedisRepository = Depends(get_repository)) -> TaskView:
    """读取单个任务的脱敏配置，供编辑面板回填当前业务设置。"""

    task = await repository.get_task(task_id)
    if not isinstance(task, TaskView):
        raise HTTPException(status_code=404, detail="任务不存在")
    return task


@app.patch("/api/tasks/{task_id}", response_model=TaskView, dependencies=[Depends(require_admin)])
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    repository: RedisRepository = Depends(get_repository),
    settings: Settings = Depends(get_runtime_settings),
) -> TaskView:
    """更新任务配置；API Key 为空沿用旧密钥，参照字段必须指向独立参照配置。"""

    if payload.reference_id is not None:
        await _validate_reference(repository, payload.reference_id)
    encrypted_api_key = (
        encrypt_api_key(payload.api_key, settings.secret_key) if payload.api_key else None
    )
    task = await repository.update_task(task_id, payload, encrypted_api_key)
    if task is None:
        raise HTTPException(status_code=404, detail="任务不存在")
    return task


@app.delete("/api/tasks/{task_id}", dependencies=[Depends(require_admin)])
async def delete_task(
    task_id: str,
    repository: RedisRepository = Depends(get_repository),
) -> dict[str, bool]:
    """删除后台任务并从公开索引移除，用于停止不再需要展示的模型监控。"""

    deleted = await repository.delete_task(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="任务不存在")
    return {"deleted": True}


@app.post("/api/tasks/{task_id}/run", response_model=RunView, dependencies=[Depends(require_admin)])
async def run_task(
    task_id: str,
    repository: RedisRepository = Depends(get_repository),
    settings: Settings = Depends(get_runtime_settings),
) -> RunView:
    """手动触发一次采样运行，便于后台用户立即验证目标模型并生成曲线点。"""

    runner = TaskRunner(repository, settings)
    try:
        return await runner.run_task(task_id)
    except RuntimeError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.post(
    "/api/tasks/{task_id}/run-jobs",
    response_model=RunJobView,
    dependencies=[Depends(require_admin)],
)
async def create_task_run_job(
    task_id: str,
    background_tasks: BackgroundTasks,
    repository: RedisRepository = Depends(get_repository),
    settings: Settings = Depends(get_runtime_settings),
) -> RunJobView:
    """创建任务手动运行后台 Job，让管理员无需等待同步请求完成。"""

    task = await repository.get_task(task_id)
    if not isinstance(task, TaskView):
        raise HTTPException(status_code=404, detail="任务不存在")
    if not task.reference_id:
        raise HTTPException(status_code=400, detail="任务未选择参照")
    await _validate_reference(repository, task.reference_id)
    job, created = await repository.create_or_get_run_job(
        "task",
        task_id,
        task.sample_count,
        "任务运行已排队，等待后台开始采样",
    )
    if created:
        background_tasks.add_task(_run_task_job, job.id, task_id, repository, settings)
    return job


@app.get(
    "/api/tasks/{task_id}/runs",
    response_model=list[RunView],
    dependencies=[Depends(require_admin)],
)
async def list_runs(
    task_id: str,
    limit: int = 50,
    repository: RedisRepository = Depends(get_repository),
) -> list[RunView]:
    """读取任务运行历史，支持后台展示成功率、错误摘要和评分变化。"""

    return await repository.list_runs(task_id, limit=max(1, min(limit, 200)))


@app.get(
    "/api/tasks/{task_id}/runs/{run_id}",
    response_model=RunDetail,
    dependencies=[Depends(require_admin)],
)
async def get_run_detail(
    task_id: str,
    run_id: str,
    repository: RedisRepository = Depends(get_repository),
) -> RunDetail:
    """读取运行详情，供后台用户查看分布、原始采样和参照分布质量。"""

    run = await repository.get_run_detail(run_id)
    if run is None or run.task_id != task_id:
        raise HTTPException(status_code=404, detail="运行记录不存在")
    return run


async def _run_reference_job(
    job_id: str,
    reference_id: str,
    repository: RedisRepository,
    settings: Settings,
) -> None:
    """执行参照后台 Job，并把采样进度、成功或错误原因持续写回 Redis。"""

    await repository.start_run_job(job_id, "参照正在采样")

    async def report_progress(
        current: int,
        total: int,
        success_count: int,
        failed_count: int,
    ) -> None:
        """把参照采样进度写入 Job，供管理台展示等待中的具体进展。"""

        await repository.update_run_job_progress(
            job_id,
            current,
            total,
            success_count,
            failed_count,
            f"参照采样中：{current}/{total}",
        )

    runner = TaskRunner(repository, settings, progress_reporter=report_progress)
    try:
        run = await runner.run_reference(reference_id)
    except Exception as error:  # noqa: BLE001 - 后台 Job 需要把所有失败转换为用户可见状态
        await repository.finish_run_job(
            job_id,
            "failed",
            None,
            0,
            0,
            "参照运行失败",
            str(error),
        )
        return
    await repository.finish_run_job(
        job_id,
        run.status,
        run.id,
        run.success_count,
        run.failed_count,
        "参照标定完成" if run.status == "success" else "参照标定失败",
        run.error_summary,
    )


async def _run_task_job(
    job_id: str,
    task_id: str,
    repository: RedisRepository,
    settings: Settings,
) -> None:
    """执行任务后台 Job，并把采样、评分和失败摘要持续同步给管理台。"""

    await repository.start_run_job(job_id, "任务正在采样")

    async def report_progress(
        current: int,
        total: int,
        success_count: int,
        failed_count: int,
    ) -> None:
        """把任务采样进度写入 Job，帮助管理员判断等待是否仍在推进。"""

        await repository.update_run_job_progress(
            job_id,
            current,
            total,
            success_count,
            failed_count,
            f"任务采样中：{current}/{total}",
        )

    runner = TaskRunner(repository, settings, progress_reporter=report_progress)
    try:
        run = await runner.run_task(task_id)
    except Exception as error:  # noqa: BLE001 - 后台 Job 需要把所有失败转换为用户可见状态
        await repository.finish_run_job(
            job_id,
            "failed",
            None,
            0,
            0,
            "任务运行失败",
            str(error),
        )
        return
    await repository.finish_run_job(
        job_id,
        run.status,
        run.id,
        run.success_count,
        run.failed_count,
        "任务运行完成" if run.status == "success" else "任务运行失败",
        run.error_summary,
    )


async def _validate_reference(repository: RedisRepository, reference_id: str) -> None:
    """校验任务选择的参照已成功标定，避免任务使用不可用的比较基准。"""

    reference = await repository.get_reference(reference_id)
    if not isinstance(reference, ReferenceView):
        raise HTTPException(status_code=400, detail="请选择有效参照")
    if not reference.latest_success_run_id:
        raise HTTPException(status_code=400, detail="请先成功运行参照，再把它作为任务基准")
