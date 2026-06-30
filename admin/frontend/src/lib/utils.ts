/** 业务说明：管理端通用工具，集中处理类名合并和时间格式化等展示辅助逻辑。 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** 业务说明：合并 Tailwind 类名，避免 shadcn 风格组件在不同业务状态下样式冲突。 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 业务说明：把后端时间转换为后台用户易读的本地时间，异常值用业务兜底文案承接。 */
export function formatDateTime(timestamp: number | string | null | undefined) {
  if (!timestamp) return "未生成";
  const normalizedTime =
    typeof timestamp === "number"
      ? timestamp * 1000
      : Number.isFinite(Number(timestamp))
        ? Number(timestamp) * 1000
        : Date.parse(timestamp);
  if (!Number.isFinite(normalizedTime)) return "未记录";
  const date = new Date(normalizedTime);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", { hour12: false });
}
