"""Provider 调用测试，验证 OpenAI 兼容响应、解析失败和重试错误处理。"""

import httpx
import pytest

from app.provider import ProviderError, ProviderRequest, request_single_number


async def test_request_single_number_openai_success() -> None:
    """OpenAI 兼容接口返回纯数字时，应被解析成有效业务采样值。"""

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"choices": [{"message": {"content": "42"}}]})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        number = await request_single_number(
            ProviderRequest(
                provider="openai",
                base_url="https://api.example.com/v1",
                api_key="key",
                model="gpt-test",
                prompt="number",
                timeout_seconds=5,
            ),
            client=client,
        )
    assert number == 42


async def test_request_single_number_returns_none_for_unparseable_text() -> None:
    """模型响应成功但没有 1-355 数字时，应记录为空采样而不是 Provider 失败。"""

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"choices": [{"message": {"content": "no number"}}]})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        number = await request_single_number(
            ProviderRequest(
                provider="openai",
                base_url="https://api.example.com",
                api_key="key",
                model="gpt-test",
                prompt="number",
                timeout_seconds=5,
            ),
            client=client,
        )
    assert number is None


async def test_request_single_number_raises_after_server_error() -> None:
    """Provider 连续 5xx 时应抛出业务错误，Runner 会把它纳入错误摘要。"""

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, text="busy")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        with pytest.raises(ProviderError):
            await request_single_number(
                ProviderRequest(
                    provider="openai",
                    base_url="https://api.example.com/v1",
                    api_key="key",
                    model="gpt-test",
                    prompt="number",
                    timeout_seconds=5,
                ),
                client=client,
                max_attempts=1,
            )

