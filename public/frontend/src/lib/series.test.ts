/** 业务说明：公开看板曲线工具测试，验证相似度评分曲线排序符合展示规则。 */
import { describe, expect, it } from "vitest";
import { toPublicScoreSeries } from "@/lib/series";

describe("public series helpers", () => {
  it("sorts score points by completion time", () => {
    const series = toPublicScoreSeries([
      { run_id: "b", completed_at: 20, display_score: 98, smooth_score: 98, success_count: 10, failed_count: 0 },
      { run_id: "a", completed_at: 10, display_score: 99, smooth_score: 99, success_count: 10, failed_count: 0 },
    ]);
    expect(series.map((point) => point.score)).toEqual([99, 98]);
  });
});
