/** 业务说明：管理端卡片组件，基于 shadcn Card 结构承载任务、图表和运行历史等独立业务信息块。 */
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** 业务说明：提供统一面板容器，让不同监控模块保持一致的边框、背景和间距。 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-slate-100 shadow-xl shadow-black/10", className)}
      {...props}
    />
  );
}

/** 业务说明：提供卡片头部区域，让标题、说明和操作入口在面板顶部形成稳定层级。 */
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

/** 业务说明：提供卡片标题区，帮助后台用户快速定位当前信息块的业务含义。 */
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-sm font-semibold text-slate-100", className)} {...props} />;
}

/** 业务说明：提供卡片说明文字，承接后台规则、约束和下一步操作提示。 */
export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-400", className)} {...props} />;
}

/** 业务说明：提供卡片主体区域，承载列表、图表和表单等核心业务内容。 */
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}

/** 业务说明：提供卡片底部区域，用于放置保存、删除等结论性业务操作。 */
export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-4 pt-0", className)} {...props} />;
}
