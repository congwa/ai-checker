/** 业务说明：公开看板页头组件，承载品牌识别和只读数据刷新入口。 */
import { motion } from "framer-motion";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

/** 业务说明：渲染公开看板顶部入口，让观察者知道当前页面身份并可手动刷新数据。 */
export function PublicHeader({ isLoading, onRefresh }: PublicHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-lg border border-white/10 bg-[#0b1420]/[0.82] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur md:flex-row md:items-center md:justify-between"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3 text-sm font-semibold text-sky-100">
          <img
            className="h-10 w-10 rounded-md object-contain shadow-[0_0_0_1px_rgba(56,189,248,.28)]"
            src="/codexbuy-logo.png"
            alt=""
            aria-hidden="true"
          />
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-300">Live AI Checker</div>
            <h1 className="mt-1 text-2xl font-bold text-slate-50 md:text-3xl">模型相似度公开看板</h1>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-10 items-center gap-2 rounded-md border border-teal-300/20 bg-teal-300/10 px-3 text-sm font-semibold text-teal-100">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_16px_rgba(45,212,191,0.7)]" />
          Live
        </span>
        <a
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-white/[0.07] px-4 text-sm font-semibold text-slate-100 transition-colors hover:border-white/[0.16] hover:bg-white/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          href="https://codexbuy.com"
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink className="h-4 w-4" />
          返回官网
        </a>
        <Button disabled={isLoading} aria-busy={isLoading} onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
          {isLoading ? "刷新中" : "刷新"}
        </Button>
      </div>
    </motion.header>
  );
}
