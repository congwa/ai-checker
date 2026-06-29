/** 业务说明：管理端通用工具，集中处理类名合并和时间格式化等展示辅助逻辑。 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** 业务说明：合并 Tailwind 类名，避免 shadcn 风格组件在不同业务状态下样式冲突。 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 业务说明：把后端秒级时间戳转换为后台用户易读的本地时间。 */
export function formatDateTime(timestamp: number | null | undefined) {
  if (!timestamp) return "未生成";
  return new Date(timestamp * 1000).toLocaleString("zh-CN", { hour12: false });
}

