"""前台公开服务配置，集中管理 Redis 地址与跨域来源等只读展示参数。"""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(slots=True)
class Settings:
    """描述公开后端读取 Redis 和服务前端看板所需的运行配置。"""

    redis_url: str
    cors_origins: list[str]


def get_settings() -> Settings:
    """从环境变量读取公开后端配置，使其可与后台服务共用同一 Redis。"""

    origins = os.getenv("PUBLIC_CORS_ORIGINS", "http://localhost:5174,http://127.0.0.1:5174")
    return Settings(
        redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        cors_origins=[origin.strip() for origin in origins.split(",") if origin.strip()],
    )

