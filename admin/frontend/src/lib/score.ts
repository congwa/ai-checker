/** 业务说明：管理端评分展示工具，统一处理相似度评分格式化和运行状态文案。 */
import type { RunView } from "@/types/domain";

/** 业务说明：格式化相似度评分，保障后台和前台看到一致的小数精度。 */
export function formatScore(score: number | null | undefined) {
  if (score === null || score === undefined || Number.isNaN(score)) return "--";
  return `${score.toFixed(2)}`;
}

/** 业务说明：把后端运行历史转为曲线数据，成功运行按时间正序展示趋势。 */
export function toScoreSeries(runs: RunView[]) {
  return runs
    .filter((run) => run.status === "success")
    .slice()
    .sort((left, right) => left.completed_at - right.completed_at)
    .map((run) => ({
      label: new Date(run.completed_at * 1000).toLocaleTimeString("zh-CN", { hour12: false }),
      publicScore: run.public_enabled ? Number((run.public_score ?? run.smooth_score).toFixed(2)) : null,
      actualScore: Number(run.display_score.toFixed(2)),
    }));
}

/** 业务说明：根据运行状态输出后台徽标文案，帮助用户快速判断采样是否可用。 */
export function getRunStatusLabel(status: RunView["status"]) {
  return status === "success" ? "成功" : "失败";
}
