/** 业务说明：公开看板卡片组件，基于 shadcn Card 结构承载任务评分、曲线和分布等独立展示块。 */
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** 业务说明：渲染公开看板信息容器，保持只读数据模块视觉一致。 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "rounded-lg border border-white/[0.095] bg-[#050807]/[0.86] p-4 shadow-[0_20px_64px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.045)] ring-1 ring-black/45 backdrop-blur-xl",
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
  return <h2 className={cn("font-display text-base font-semibold text-[#f4fffb]", className)} {...props} />;
}

/** 业务说明：渲染公开看板卡片说明，承载数据口径或更新时间等辅助信息。 */
export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-6 text-[#83958f]", className)} {...props} />;
}

/** 业务说明：渲染公开看板卡片主体，承载曲线、分布和关键指标。 */
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}
