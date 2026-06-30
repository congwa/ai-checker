/** 业务说明：后台业务面板组件，统一列表、图表和诊断区域的标题、说明与动作布局。 */
import type { ReactNode } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminPanelProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** 业务说明：渲染可复用后台面板，让不同业务模块拥有一致的信息层级和操作入口。 */
export function AdminPanel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: AdminPanelProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#39e6c1]/70 via-white/20 to-[#ffb84d]/60" />
      <div className="flex flex-col gap-3 border-b border-white/[0.12] pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <div className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{description}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("mt-4", bodyClassName)}>{children}</div>
    </Card>
  );
}
