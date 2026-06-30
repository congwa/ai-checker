/** 业务说明：公开看板通用工具，处理类名合并、时间格式和分数展示。 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** 业务说明：合并 Tailwind 类名，让公开卡片和状态样式可以安全组合。 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 业务说明：格式化公开看板时间，帮助观察者理解曲线点更新时间。 */
export function formatDateTime(timestamp: number | null | undefined) {
  if (!timestamp) return "暂无";
  return new Date(timestamp * 1000).toLocaleString("zh-CN", { hour12: false });
}

/** 业务说明：格式化公开相似度评分，保证看板所有任务使用一致精度。 */
export function formatScore(score: number | null | undefined) {
  if (score === null || score === undefined || Number.isNaN(score)) return "--";
  return score.toFixed(2);
}
