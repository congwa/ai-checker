/** 业务说明：公开看板徽标组件，基于 shadcn Badge 模式展示公开任务的运行状态和调度状态。 */
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "success" | "warning" | "danger" | "neutral";

const badgeVariants = cva("inline-flex items-center rounded border px-2 py-1 text-xs font-semibold", {
  variants: {
    tone: {
      success: "border-teal-400/30 bg-teal-400/10 text-teal-200",
      warning: "border-sky-400/30 bg-sky-400/10 text-sky-200",
      danger: "border-rose-400/30 bg-rose-400/10 text-rose-200",
      neutral: "border-slate-700 bg-slate-800 text-slate-300",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/** 业务说明：渲染状态徽标，帮助公开用户快速理解任务健康状态。 */
export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
