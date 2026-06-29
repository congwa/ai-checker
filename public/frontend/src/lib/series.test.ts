/** 业务说明：公开看板曲线工具测试，验证曲线排序和分布聚合符合展示规则。 */
import { describe, expect, it } from "vitest";
import { toDistributionBuckets, toPublicScoreSeries } from "@/lib/series";

describe("public series helpers", () => {
  it("sorts score points by completion time", () => {
    const series = toPublicScoreSeries([
      { run_id: "b", completed_at: 20, display_score: 98, smooth_score: 98, success_count: 10, failed_count: 0 },
      { run_id: "a", completed_at: 10, display_score: 99, smooth_score: 99, success_count: 10, failed_count: 0 },
    ]);
    expect(series.map((point) => point.smooth)).toEqual([99, 98]);
  });

  it("buckets the distribution for compact charts", () => {
    const distribution = Array(355).fill(0);
    distribution[0] = 0.5;
    distribution[9] = 0.5;
    expect(toDistributionBuckets(distribution)[0]).toEqual({ label: "1-10", value: 1 });
  });
});

