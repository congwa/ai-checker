/** 业务说明：管理端 API 工具测试，验证请求转换和错误处理服务于后台业务操作。 */
import { describe, expect, it, vi } from "vitest";
import { fetchTasks } from "@/lib/api";

describe("admin api client", () => {
  it("sends bearer token when fetching tasks", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchTasks("abc");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8010/api/tasks",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer abc" }),
      }),
    );
    vi.unstubAllGlobals();
  });
});

