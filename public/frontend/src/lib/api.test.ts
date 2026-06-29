/** 业务说明：公开 API 客户端测试，验证看板请求使用只读接口。 */
import { describe, expect, it, vi } from "vitest";
import { fetchOverview } from "@/lib/api";

describe("public api client", () => {
  it("fetches overview from public backend", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ tasks: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchOverview();

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:8020/api/overview");
    vi.unstubAllGlobals();
  });
});

