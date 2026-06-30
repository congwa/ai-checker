"""模型 Provider 调用模块，负责以 OpenAI/Anthropic 兼容协议采集随机数样本。"""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

import httpx

from app.fingerprint_algorithm import extract_probe_number
from app.models import ProviderName


class ProviderError(RuntimeError):
    """表示模型 API 调用失败，Runner 会把该错误折算为一次采样失败。"""


@dataclass(slots=True)
class ProviderRequest:
    """描述一次模型采样请求所需的业务上下文，避免 Runner 直接拼接厂商协议。"""

    provider: ProviderName
    base_url: str
    api_key: str
    model: str
    prompt: str
    timeout_seconds: float


NumberRequester = Callable[[ProviderRequest], Awaitable[int | None]]
ProgressReporter = Callable[[int, int, int, int], Awaitable[None]]


def normalize_base_url(base_url: str) -> str:
    """规范 OpenAI 兼容地址，降低用户录入是否包含 /v1 对任务执行的影响。"""

    clean = base_url.strip().rstrip("/")
    if not clean:
        return clean
    if clean.startswith("/") or clean.endswith("/v1") or "/v1/" in clean:
        return clean
    return f"{clean}/v1"


def build_endpoint(base_url: str, provider: ProviderName) -> str:
    """根据 Provider 类型生成实际请求端点，统一后台任务配置与厂商协议差异。"""

    clean = base_url.strip().rstrip("/")
    if provider == "openai":
        return f"{normalize_base_url(clean)}/chat/completions"
    if clean.endswith("/v1"):
        return f"{clean}/messages"
    return f"{clean}/v1/messages"


async def call_openai(
    request: ProviderRequest,
    client: httpx.AsyncClient | None = None,
) -> str:
    """调用 OpenAI 兼容接口并返回文本结果，用于采集该模型的一次随机数输出。"""

    owns_client = client is None
    active_client = client or httpx.AsyncClient(timeout=request.timeout_seconds)
    try:
        response = await active_client.post(
            build_endpoint(request.base_url, "openai"),
            headers={
                "Authorization": f"Bearer {request.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": request.model,
                "messages": [{"role": "user", "content": request.prompt}],
                "temperature": 1.0,
                "max_tokens": 10,
            },
        )
        if response.status_code >= 400:
            raise ProviderError(f"API错误: {response.status_code} - {response.text}")
        data = response.json()
        return str(data["choices"][0]["message"]["content"]).strip()
    finally:
        if owns_client:
            await active_client.aclose()


async def call_anthropic(
    request: ProviderRequest,
    client: httpx.AsyncClient | None = None,
) -> str:
    """调用 Anthropic Messages 接口并返回文本结果，用于兼容后续 Claude 类模型任务。"""

    owns_client = client is None
    active_client = client or httpx.AsyncClient(timeout=request.timeout_seconds)
    try:
        response = await active_client.post(
            build_endpoint(request.base_url, "anthropic"),
            headers={
                "x-api-key": request.api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": request.model,
                "messages": [{"role": "user", "content": request.prompt}],
                "temperature": 1.0,
                "max_tokens": 10,
            },
        )
        if response.status_code >= 400:
            raise ProviderError(f"API错误: {response.status_code} - {response.text}")
        data = response.json()
        return str(data["content"][0]["text"]).strip()
    finally:
        if owns_client:
            await active_client.aclose()


def _should_retry(error: Exception) -> bool:
    """判断采样失败是否属于临时错误，避免 429/5xx 直接污染任务成功率。"""

    message = str(error)
    return any(code in message for code in ("429", "500", "502", "503", "504"))


async def request_single_number(
    request: ProviderRequest,
    client: httpx.AsyncClient | None = None,
    max_attempts: int = 2,
) -> int | None:
    """完成一次模型调用和数字解析，返回空值表示响应成功但不满足采样格式。"""

    last_error: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            text = (
                await call_openai(request, client)
                if request.provider == "openai"
                else await call_anthropic(request, client)
            )
            return extract_probe_number(text)
        except Exception as error:  # noqa: BLE001 - 业务上需要把 Provider 异常归并为采样失败
            last_error = error
            if attempt >= max_attempts or not _should_retry(error):
                break
            await asyncio.sleep(1.2 * attempt * attempt)
    raise ProviderError(str(last_error) if last_error else "模型采样失败")


async def collect_numbers(
    request: ProviderRequest,
    sample_count: int,
    delay_seconds: float,
    progress_reporter: ProgressReporter | None = None,
    requester: NumberRequester = request_single_number,
) -> tuple[list[int], list[str]]:
    """按任务采样次数批量请求模型，返回有效数字和可展示的失败摘要。"""

    numbers: list[int] = []
    errors: list[str] = []
    for index in range(sample_count):
        try:
            number = await requester(request)
            if number is None:
                errors.append(f"第 {index + 1} 次响应无法解析为 1-355 的数字")
            else:
                numbers.append(number)
        except Exception as error:  # noqa: BLE001 - Runner 需要继续采样并汇总失败原因
            errors.append(f"第 {index + 1} 次请求失败: {error}")
        if progress_reporter is not None:
            await progress_reporter(index + 1, sample_count, len(numbers), len(errors))
        if delay_seconds > 0 and index < sample_count - 1:
            await asyncio.sleep(delay_seconds)
    return numbers, errors
