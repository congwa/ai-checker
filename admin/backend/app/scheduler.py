"""后台调度器入口，周期性扫描到期任务并调用 Runner 执行模型采样。"""

from __future__ import annotations

import asyncio
import logging

from redis.asyncio import Redis

from app.config import get_settings
from app.repository import RedisRepository
from app.runner import TaskRunner

logger = logging.getLogger(__name__)


async def run_scheduler_forever() -> None:
    """持续扫描 Redis 中到期任务，保障后台配置的定时采样按频率运行。"""

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    settings = get_settings()
    repository = RedisRepository(Redis.from_url(settings.redis_url, decode_responses=True))
    runner = TaskRunner(repository, settings)
    try:
        while True:
            due_tasks = await repository.get_due_tasks()
            if due_tasks:
                logger.info("发现 %s 个到期任务", len(due_tasks))
            for task in due_tasks:
                try:
                    run = await runner.run_task(task["id"])
                    logger.info("任务 %s 运行完成，状态 %s", task["id"], run.status)
                except Exception as error:  # noqa: BLE001 - 调度器不能因单个任务失败退出
                    logger.exception("任务 %s 运行失败: %s", task["id"], error)
            await asyncio.sleep(settings.scheduler_poll_seconds)
    finally:
        await repository.close()


def main() -> None:
    """命令行启动调度器，供本地开发和生产进程管理器直接调用。"""

    asyncio.run(run_scheduler_forever())


if __name__ == "__main__":
    main()

