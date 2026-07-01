/** 业务说明：管理端徽标组件，基于 shadcn Badge 模式显示任务启用、公开状态和运行成功失败状态。 */
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "info";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors",
  {
    variants: {
      tone: {
        success: "border-[#39e6c1]/[0.35] bg-[#39e6c1]/[0.12] text-[#b7fff0]",
        warning: "border-[#ffb84d]/[0.35] bg-[#ffb84d]/[0.12] text-[#ffe0a6]",
        danger: "border-rose-300/[0.35] bg-rose-400/[0.12] text-rose-100",
        neutral: "border-white/[0.12] bg-white/[0.07] text-slate-300",
        info: "border-[#6ba8ff]/[0.35] bg-[#6ba8ff]/[0.12] text-[#cfe1ff]",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/** 业务说明：渲染紧凑状态标签，帮助用户在任务列表中快速扫读风险。 */
export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ tone }), className)}
      {...props}
    />
  );
}

export { badgeVariants };
