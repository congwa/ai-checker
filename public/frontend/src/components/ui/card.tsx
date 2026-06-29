/** 业务说明：公开看板卡片组件，承载任务评分、曲线和分布等独立展示块。 */
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** 业务说明：渲染公开看板信息容器，保持只读数据模块视觉一致。 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("rounded-lg border border-sky-900/60 bg-slate-950/70 p-4 shadow-xl shadow-black/10", className)}
      {...props}
    />
  );
}

/** 业务说明：渲染公开看板模块标题，帮助观察者快速定位数据维度。 */
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-sm font-semibold text-sky-100", className)} {...props} />;
}

