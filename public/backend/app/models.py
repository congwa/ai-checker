"""公开 API 响应模型，确保前台看板只能读取脱敏后的任务、评分和分布数据。"""

from __future__ import annotations

from pydantic import BaseModel, Field


class PublicTask(BaseModel):
    """公开任务摘要，不包含 baseurl、API Key 和后台错误详情等敏感字段。"""

    id: str
    name: str
    model: str
    enabled: bool
    last_run_id: str | None = None
    last_smooth_score: float | None = None
    latest_status: str | None = None
    updated_at: float


class OverviewResponse(BaseModel):
    """公开首页聚合数据，帮助前台一次渲染全部可见任务卡片。"""

    tasks: list[PublicTask]


class SeriesPoint(BaseModel):
    """公开评分曲线点，展示一次成功运行的平滑分和原始展示分。"""

    run_id: str
    completed_at: float
    display_score: float
    smooth_score: float
    success_count: int
    failed_count: int


class SeriesResponse(BaseModel):
    """公开曲线响应，包含任务名称和时间窗口内的评分点。"""

    task: PublicTask
    points: list[SeriesPoint]


class PublicRunDetail(BaseModel):
    """公开运行详情，包含脱敏统计和分布，但不暴露原始 API 配置或错误日志。"""

    id: str
    task_id: str
    completed_at: float
    display_score: float
    smooth_score: float
    success_count: int
    failed_count: int
    stats: dict[str, float | int] = Field(default_factory=dict)
    distribution: list[float]

