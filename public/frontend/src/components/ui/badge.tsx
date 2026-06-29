/** 业务说明：公开看板徽标组件，用于展示公开任务的运行状态和调度状态。 */
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "success" | "warning" | "danger" | "neutral";

const tones: Record<BadgeTone, string> = {
  success: "border-teal-400/30 bg-teal-400/10 text-teal-200",
  warning: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  danger: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  neutral: "border-slate-700 bg-slate-800 text-slate-300",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

/** 业务说明：渲染状态徽标，帮助公开用户快速理解任务健康状态。 */
export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return <span className={cn("inline-flex rounded px-2 py-1 text-xs font-semibold", tones[tone], className)} {...props} />;
}

