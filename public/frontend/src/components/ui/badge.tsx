/** 业务说明：公开看板徽标组件，基于 shadcn Badge 模式展示公开任务的运行状态和调度状态。 */
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "success" | "warning" | "danger" | "neutral";

const badgeVariants = cva("inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]", {
  variants: {
    tone: {
      success: "border-[#5eead4]/[0.34] bg-[#5eead4]/[0.11] text-[#ccfbf1]",
      warning: "border-[#fbbf24]/[0.34] bg-[#fbbf24]/[0.11] text-[#fde68a]",
      danger: "border-rose-300/[0.34] bg-rose-400/[0.11] text-rose-100",
      neutral: "border-white/[0.11] bg-white/[0.065] text-[#c4d3cd]",
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
