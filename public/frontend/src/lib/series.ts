/** 业务说明：公开看板曲线工具，统一把后端评分点转换为 ECharts 输入数据。 */
import type { SeriesPoint } from "@/types/domain";

/** 业务说明：将公开 API 曲线点转成图表数据，并保证时间顺序稳定。 */
export function toPublicScoreSeries(points: SeriesPoint[]) {
  return points
    .slice()
    .sort((left, right) => left.completed_at - right.completed_at)
    .map((point) => ({
      label: new Date(point.completed_at * 1000).toLocaleTimeString("zh-CN", { hour12: false }),
      score: Number(point.smooth_score.toFixed(2)),
    }));
}
