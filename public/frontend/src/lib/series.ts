/** 业务说明：公开看板曲线工具，统一把后端评分点转换为 ECharts 输入数据。 */
import type { SeriesPoint } from "@/types/domain";

/** 业务说明：将公开 API 曲线点转成图表数据，并保证时间顺序稳定。 */
export function toPublicScoreSeries(points: SeriesPoint[]) {
  return points
    .slice()
    .sort((left, right) => left.completed_at - right.completed_at)
    .map((point) => ({
      label: new Date(point.completed_at * 1000).toLocaleTimeString("zh-CN", { hour12: false }),
      smooth: Number(point.smooth_score.toFixed(2)),
      display: Number(point.display_score.toFixed(2)),
    }));
}

/** 业务说明：把 355 维分布聚合成固定桶，服务公开分布图展示。 */
export function toDistributionBuckets(distribution: number[], bucketSize = 10) {
  const bucketCount = Math.ceil(355 / bucketSize);
  return Array.from({ length: bucketCount }, (_, index) => ({
    label: `${index * bucketSize + 1}-${Math.min((index + 1) * bucketSize, 355)}`,
    value: distribution
      .slice(index * bucketSize, (index + 1) * bucketSize)
      .reduce((sum, value) => sum + value, 0),
  }));
}

