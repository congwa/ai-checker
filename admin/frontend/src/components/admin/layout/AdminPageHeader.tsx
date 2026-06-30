/** 业务说明：后台页面页头组件，统一模块标题、登录状态、刷新和退出操作。 */
import { ExternalLink, LogOut, RefreshCw } from "lucide-react";
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
      className="relative overflow-hidden rounded-lg border border-white/[0.12] bg-[linear-gradient(135deg,rgba(17,22,24,0.93),rgba(8,10,11,0.88))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl md:flex md:items-center md:justify-between md:gap-4"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#b7f860] via-[#39e6c1] to-[#ffb84d]" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#d8ff8f]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#b7f860] shadow-[0_0_18px_rgba(183,248,96,0.58)]" />
          {eyebrow}
        </div>
        <h1 className="mt-2 break-words font-display text-2xl font-bold text-[#f6f8f0] md:text-3xl">{title}</h1>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-0">
        <StatusBadge status="success" label="已登录" />
        <a
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/[0.12] bg-white/[0.075] px-4 text-sm font-semibold text-slate-100 transition-[transform,background-color,border-color] duration-200 hover:-translate-y-px hover:border-white/[0.2] hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f860]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050607] lg:h-10"
          href="https://codexbuy.com"
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink className="h-4 w-4" />
          返回官网
        </a>
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
