"""后台管理 API 的请求与响应模型，定义参照配置、任务配置和运行结果的数据边界。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.config import DEFAULT_PROMPT
from app.scoring import validate_public_score_range

ProviderName = Literal["openai", "anthropic"]
RunStatus = Literal["success", "failed"]
RunJobKind = Literal["reference", "task"]
RunJobStatus = Literal["queued", "running", "success", "failed"]


class ReferenceCreate(BaseModel):
    """创建参照配置时的业务输入，用于单独标定某个 AI 的基准分布。"""

    name: str = Field(min_length=1, max_length=120)
    provider: ProviderName = "openai"
    base_url: str = Field(min_length=1)
    api_key: str = Field(min_length=1)
    model: str = Field(min_length=1)
    prompt: str = DEFAULT_PROMPT
    sample_count: int = Field(default=50, ge=10, le=500)


class ReferenceUpdate(BaseModel):
    """更新参照配置时的业务输入，API Key 为空表示沿用已保存密钥。"""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    provider: ProviderName | None = None
    base_url: str | None = Field(default=None, min_length=1)
    api_key: str | None = None
    model: str | None = Field(default=None, min_length=1)
    prompt: str | None = None
    sample_count: int | None = Field(default=None, ge=10, le=500)


class ReferenceView(BaseModel):
    """返回给后台页面的参照视图，隐藏 API Key 但展示最新标定运行。"""

    id: str
    name: str
    provider: ProviderName
    base_url: str
    model: str
    prompt: str
    sample_count: int
    latest_run_id: str | None = None
    latest_success_run_id: str | None = None
    latest_run_status: RunStatus | None = None
    created_at: float
    updated_at: float


class TaskCreate(BaseModel):
    """创建监控任务时的业务输入，覆盖待测目标、参照选择、频率和评分策略。"""

    name: str = Field(min_length=1, max_length=120)
    provider: ProviderName = "openai"
    base_url: str = Field(min_length=1)
    api_key: str = Field(min_length=1)
    model: str = Field(min_length=1)
    reference_id: str = Field(min_length=1)
    prompt: str = DEFAULT_PROMPT
    sample_count: int = Field(default=50, ge=10, le=500)
    interval_seconds: int = Field(default=3600, ge=60, le=604800)
    smoothing_level: int = Field(default=65, ge=0, le=100)
    enabled: bool = True
    public_enabled: bool = False
    public_score_range_enabled: bool = False
    public_score_min: float = Field(default=85.0, ge=0, le=100)
    public_score_max: float = Field(default=100.0, ge=0, le=100)

    @model_validator(mode="after")
    def validate_score_range(self) -> TaskCreate:
        """确保渠道前台显示分区间合法，避免创建后公开分无法计算。"""

        validate_public_score_range(self.public_score_min, self.public_score_max)
        return self


class TaskUpdate(BaseModel):
    """更新监控任务时的业务输入，API Key 为空表示沿用已保存密钥。"""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    provider: ProviderName | None = None
    base_url: str | None = Field(default=None, min_length=1)
    api_key: str | None = None
    model: str | None = Field(default=None, min_length=1)
    reference_id: str | None = Field(default=None, min_length=1)
    prompt: str | None = None
    sample_count: int | None = Field(default=None, ge=10, le=500)
    interval_seconds: int | None = Field(default=None, ge=60, le=604800)
    smoothing_level: int | None = Field(default=None, ge=0, le=100)
    enabled: bool | None = None
    public_enabled: bool | None = None
    public_score_range_enabled: bool | None = None
    public_score_min: float | None = Field(default=None, ge=0, le=100)
    public_score_max: float | None = Field(default=None, ge=0, le=100)

    @model_validator(mode="after")
    def validate_score_range_when_complete(self) -> TaskUpdate:
        """当更新请求同时包含最低和最高分时，提前校验区间合法性。"""

        if self.public_score_min is not None and self.public_score_max is not None:
            validate_public_score_range(self.public_score_min, self.public_score_max)
        return self


class TaskView(BaseModel):
    """返回给后台页面的任务视图，隐藏 API Key 但保留运行与公开状态。"""

    id: str
    name: str
    provider: ProviderName
    base_url: str
    model: str
    reference_id: str | None = None
    prompt: str
    sample_count: int
    interval_seconds: int
    smoothing_level: int
    enabled: bool
    public_enabled: bool
    public_score_range_enabled: bool
    public_score_min: float
    public_score_max: float
    baseline_run_id: str | None = None
    last_run_id: str | None = None
    last_smooth_score: float | None = None
    next_run_at: float
    created_at: float
    updated_at: float


class RunView(BaseModel):
    """返回一次采样运行结果，供后台诊断成功率、评分和错误摘要。"""

    id: str
    task_id: str
    status: RunStatus
    started_at: float
    completed_at: float
    sample_count: int
    success_count: int
    failed_count: int
    raw_similarity: float
    display_score: float
    smooth_score: float
    public_enabled: bool = True
    public_score_override: float | None = None
    public_score: float | None = None
    baseline_run_id: str | None = None
    error_summary: str | None = None
    stats: dict[str, float | int] = Field(default_factory=dict)

    @model_validator(mode="after")
    def fill_public_score(self) -> RunView:
        """没有单独覆盖时，前台展示分沿用系统计算出的相似度评分。"""

        if self.status != "success" and "public_enabled" not in self.model_fields_set:
            self.public_enabled = False
        if self.public_score is None:
            self.public_score = (
                self.public_score_override
                if self.public_score_override is not None
                else self.smooth_score
            )
        return self


class RunPublicUpdate(BaseModel):
    """更新某次运行在公开看板上的展示状态和可选展示分数。"""

    public_enabled: bool | None = None
    public_score_override: float | None = Field(default=None, ge=0, le=100)


class RunDetail(RunView):
    """返回运行详情时附带分布和原始采样，支持后台复查基准质量。"""

    distribution: list[float]
    numbers: list[int]


class RunJobView(BaseModel):
    """返回手动运行任务的后台 Job 状态，让管理端能展示排队、运行和失败闭环。"""

    id: str
    kind: RunJobKind
    target_id: str
    status: RunJobStatus
    run_id: str | None = None
    progress_current: int = 0
    progress_total: int = 0
    success_count: int = 0
    failed_count: int = 0
    message: str | None = None
    error_summary: str | None = None
    created_at: float
    started_at: float | None = None
    completed_at: float | None = None
    updated_at: float
