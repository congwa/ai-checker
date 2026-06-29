/** 业务说明：管理端卡片组件，承载任务、图表和运行历史等独立业务信息块。 */
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** 业务说明：提供统一面板容器，让不同监控模块保持一致的边框、背景和间距。 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("rounded-lg border border-slate-800 bg-slate-950/70 p-4 shadow-xl shadow-black/10", className)}
      {...props}
    />
  );
}

/** 业务说明：提供卡片标题区，帮助后台用户快速定位当前信息块的业务含义。 */
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-sm font-semibold text-slate-100", className)} {...props} />;
}

