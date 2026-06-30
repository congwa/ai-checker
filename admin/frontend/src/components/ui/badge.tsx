/** 业务说明：管理端徽标组件，基于 shadcn Badge 模式显示任务启用、公开状态和运行成功失败状态。 */
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "info";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors",
  {
    variants: {
      tone: {
        success: "border-teal-300/30 bg-teal-300/10 text-teal-100",
        warning: "border-amber-300/30 bg-amber-300/10 text-amber-100",
        danger: "border-rose-300/30 bg-rose-300/10 text-rose-100",
        neutral: "border-white/10 bg-white/[0.07] text-slate-300",
        info: "border-sky-300/30 bg-sky-300/10 text-sky-100",
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
