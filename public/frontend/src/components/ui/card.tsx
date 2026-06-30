/** 业务说明：公开看板卡片组件，基于 shadcn Card 结构承载任务评分、曲线和分布等独立展示块。 */
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** 业务说明：渲染公开看板信息容器，保持只读数据模块视觉一致。 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "rounded-lg border border-white/10 bg-[#0b1420]/[0.86] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.26)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

/** 业务说明：渲染公开看板卡片头部，让标题、状态徽标和操作入口保持稳定层级。 */
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

/** 业务说明：渲染公开看板模块标题，帮助观察者快速定位数据维度。 */
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-sm font-semibold tracking-[0.01em] text-sky-50", className)} {...props} />;
}

/** 业务说明：渲染公开看板卡片说明，承载数据口径或更新时间等辅助信息。 */
export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-400", className)} {...props} />;
}

/** 业务说明：渲染公开看板卡片主体，承载曲线、分布和关键指标。 */
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}
