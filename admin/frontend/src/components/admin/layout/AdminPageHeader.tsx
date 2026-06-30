/** 业务说明：后台页面页头组件，统一模块标题、登录状态、刷新和退出操作。 */
import { LogOut, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StatusBadge, StatusIcon } from "@/components/ui/status";

interface AdminPageHeaderProps {
  eyebrow: string;
  title: string;
  isLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

/** 业务说明：渲染管理页面标题和全局动作，让用户在任意模块都能确认位置并刷新数据。 */
export function AdminPageHeader({
  eyebrow,
  title,
  isLoading,
  onRefresh,
  onLogout,
}: AdminPageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-teal-200">
          {eyebrow}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-50 md:text-3xl">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status="success" label="已登录" />
        <Button variant="secondary" onClick={onRefresh} disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? (
            <StatusIcon status="running" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isLoading ? "刷新中" : "刷新"}
        </Button>
        <Button variant="secondary" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          退出
        </Button>
      </div>
    </motion.header>
  );
}
