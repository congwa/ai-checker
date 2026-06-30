/** 业务说明：管理端徽标组件，用于显示任务启用、公开状态和运行成功失败状态。 */
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "info";

const tones: Record<BadgeTone, string> = {
  success: "border-teal-400/30 bg-teal-400/10 text-teal-200",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  danger: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  neutral: "border-slate-600 bg-slate-800 text-slate-300",
  info: "border-sky-400/30 bg-sky-400/10 text-sky-200",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

/** 业务说明：渲染紧凑状态标签，帮助用户在任务列表中快速扫读风险。 */
export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded px-2 py-1 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}
