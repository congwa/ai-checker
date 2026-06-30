/** 业务说明：管理端 API 工具测试，验证请求转换和错误处理服务于后台业务操作。 */
import { describe, expect, it, vi } from "vitest";
import { createReferenceRunJob, fetchTasks } from "@/lib/api";

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

  it("creates reference run jobs for async calibration feedback", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: "job-1",
            kind: "reference",
            target_id: "reference-1",
            status: "queued",
            run_id: null,
            progress_current: 0,
            progress_total: 50,
            success_count: 0,
            failed_count: 0,
            message: "参照运行已排队",
            error_summary: null,
            created_at: 1,
            started_at: null,
            completed_at: null,
            updated_at: 1,
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const job = await createReferenceRunJob("abc", "reference-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8010/api/references/reference-1/run-jobs",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer abc" }),
      }),
    );
    expect(job.status).toBe("queued");
    vi.unstubAllGlobals();
  });
});
