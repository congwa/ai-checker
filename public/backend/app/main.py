"""前台公开 FastAPI 入口，提供不需要登录的脱敏看板数据接口。"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis

from app.config import get_settings
from app.models import OverviewResponse, PublicRunDetail, SeriesResponse
from app.repository import PublicRepository


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """管理公开服务生命周期，启动时连接 Redis，关闭时释放连接。"""

    settings = get_settings()
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    app.state.repository = PublicRepository(redis)
    try:
        yield
    finally:
        await app.state.repository.close()


app = FastAPI(title="AI Checker Public API", version="0.1.0", lifespan=lifespan)
settings_for_cors = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings_for_cors.cors_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def get_repository() -> PublicRepository:
    """向公开路由注入只读 Redis 仓库，使 API 层不接触敏感任务字段。"""

    return app.state.repository


@app.get("/health")
async def health() -> dict[str, str]:
    """返回公开 API 健康状态，供部署探针确认看板服务可用。"""

    return {"status": "ok"}


@app.get("/api/overview", response_model=OverviewResponse)
async def overview(repository: PublicRepository = Depends(get_repository)) -> OverviewResponse:
    """返回全部公开任务摘要，支撑前台首页一次性渲染所有监控卡片。"""

    return OverviewResponse(tasks=await repository.list_public_tasks())


@app.get("/api/tasks/{task_id}/series", response_model=SeriesResponse)
async def task_series(
    task_id: str,
    range: str = "30d",  # noqa: A002 - HTTP 查询参数沿用业务命名 range
    repository: PublicRepository = Depends(get_repository),
) -> SeriesResponse:
    """返回公开任务评分曲线，默认展示最近 30 天成功运行点。"""

    result = await repository.get_series(task_id, range)
    if result is None:
        raise HTTPException(status_code=404, detail="公开任务不存在")
    task, points = result
    return SeriesResponse(task=task, points=points)


@app.get("/api/tasks/{task_id}/runs/{run_id}", response_model=PublicRunDetail)
async def run_detail(
    task_id: str,
    run_id: str,
    repository: PublicRepository = Depends(get_repository),
) -> PublicRunDetail:
    """返回公开运行详情，供前台展示分布对比和脱敏统计。"""

    detail = await repository.get_public_run_detail(task_id, run_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="公开运行记录不存在")
    return detail
