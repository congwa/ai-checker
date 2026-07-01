/** 业务说明：后台页面页头组件，统一模块标题、登录状态、刷新和退出操作。 */
import { ExternalLink, LogOut, RadioTower, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StatusIcon } from "@/components/ui/status";

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
      className="relative overflow-hidden rounded-lg border border-white/[0.11] bg-[linear-gradient(135deg,rgba(16,21,22,0.94),rgba(5,7,8,0.9))] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.055)] backdrop-blur-xl md:flex md:items-center md:justify-between md:gap-4"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#b7f860] via-[#39e6c1] to-[#ffb84d]" />
      <div className="absolute right-4 top-4 h-12 w-24 rounded-sm border-r border-t border-white/[0.08]" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#d8ff8f]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#b7f860] shadow-[0_0_18px_rgba(183,248,96,0.58)]" />
          {eyebrow}
        </div>
        <h1 className="mt-2 break-words font-display text-2xl font-bold leading-tight text-[#f6f8f0] md:text-3xl">{title}</h1>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-0">
        <span className="inline-flex h-10 items-center gap-2 rounded-md border border-[#39e6c1]/25 bg-[#39e6c1]/[0.1] px-3 text-sm font-semibold text-[#b7fff0]">
          <RadioTower className="h-4 w-4" />
          已登录
        </span>
        <a
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/[0.12] bg-white/[0.07] px-4 text-sm font-semibold text-slate-100 transition-[transform,background-color,border-color] duration-200 hover:-translate-y-px hover:border-white/[0.2] hover:bg-white/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f860]/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030506] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
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
