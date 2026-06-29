"""后台管理服务配置，集中承载 Redis、鉴权、加密和调度相关的业务运行参数。"""

from __future__ import annotations

import os
from dataclasses import dataclass

DEFAULT_PROMPT = "请从1到355之间随机选择一个数字，只输出这个数字，不要有任何其他内容。"


@dataclass(slots=True)
class Settings:
    """描述后台管理服务在不同环境中的业务约束和外部依赖地址。"""

    redis_url: str
    admin_token: str
    secret_key: str
    cors_origins: list[str]
    scheduler_poll_seconds: int
    provider_timeout_seconds: float
    request_delay_seconds: float


def get_settings() -> Settings:
    """从环境变量读取后台服务配置，用于让部署环境决定密钥、Redis 和调度频率。"""

    origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    return Settings(
        redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        admin_token=os.getenv("ADMIN_TOKEN", "zhangzongkang"),
        secret_key=os.getenv("SECRET_KEY", "change-me-in-production"),
        cors_origins=[origin.strip() for origin in origins.split(",") if origin.strip()],
        scheduler_poll_seconds=int(os.getenv("SCHEDULER_POLL_SECONDS", "60")),
        provider_timeout_seconds=float(os.getenv("PROVIDER_TIMEOUT_SECONDS", "30")),
        request_delay_seconds=float(os.getenv("REQUEST_DELAY_SECONDS", "0.3")),
    )
