/** 业务说明：管理端评分工具测试，确保曲线转换和分数格式与业务展示规则一致。 */
import { describe, expect, it } from "vitest";
import { formatScore, toScoreSeries } from "@/lib/score";
import type { RunView } from "@/types/domain";

/** 业务说明：构造运行记录测试数据，避免每个用例重复声明无关字段。 */
function makeRun(id: string, completedAt: number, status: RunView["status"], score: number): RunView {
  return {
    id,
    task_id: "task-1",
    status,
    started_at: completedAt - 1,
    completed_at: completedAt,
    sample_count: 50,
    success_count: status === "success" ? 50 : 0,
    failed_count: status === "success" ? 0 : 50,
    raw_similarity: 1,
    display_score: score,
    smooth_score: score,
    baseline_run_id: "run-1",
    error_summary: null,
    stats: {},
  };
}

describe("admin score helpers", () => {
  it("formats absent and present scores", () => {
    expect(formatScore(undefined)).toBe("--");
    expect(formatScore(98.456)).toBe("98.46");
  });

  it("keeps only successful runs sorted by completion time", () => {
    const series = toScoreSeries([
      makeRun("run-2", 20, "success", 98),
      makeRun("run-1", 10, "success", 99),
      makeRun("run-3", 30, "failed", 90),
    ]);
    expect(series.map((point) => point.publicScore)).toEqual([99, 98]);
  });
});
