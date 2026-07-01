/** 业务说明：公开看板页头组件，承载品牌识别和只读数据刷新入口。 */
import { motion } from "framer-motion";
import { ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
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
      className="relative flex flex-col gap-4 overflow-hidden rounded-lg border border-white/[0.11] bg-[linear-gradient(135deg,rgba(13,21,25,0.94),rgba(5,9,12,0.9))] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.055)] backdrop-blur-xl md:flex-row md:items-center md:justify-between"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#6ba8ff] via-[#39e6c1] to-[#ffb84d]" />
      <div className="absolute right-4 top-4 h-12 w-24 rounded-sm border-r border-t border-white/[0.08]" />
      <div className="min-w-0">
        <div className="flex items-center gap-3 text-sm font-semibold text-sky-100">
          <img
            className="h-11 w-11 rounded-md bg-black/30 object-contain p-1 shadow-[0_0_0_1px_rgba(107,168,255,.3)]"
            src="/codexbuy-logo.png"
            alt=""
            aria-hidden="true"
          />
          <div>
            <div className="text-xs font-semibold text-[#cfe1ff]">Live AI Checker</div>
            <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-[#f4f8ff] md:text-3xl">模型相似度公开看板</h1>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-10 items-center gap-2 rounded-md border border-[#6ba8ff]/25 bg-[#6ba8ff]/[0.1] px-3 text-sm font-semibold text-[#cfe1ff]">
          <ShieldCheck className="h-4 w-4" />
          只读
        </span>
        <span className="inline-flex h-10 items-center gap-2 rounded-md border border-[#39e6c1]/25 bg-[#39e6c1]/[0.12] px-3 text-sm font-semibold text-[#b7fff0]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#39e6c1] shadow-[0_0_16px_rgba(57,230,193,0.58)]" />
          Live
        </span>
        <a
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/[0.12] bg-white/[0.07] px-4 text-sm font-semibold text-slate-100 transition-[transform,background-color,border-color] duration-200 hover:-translate-y-px hover:border-white/[0.2] hover:bg-white/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6ba8ff]/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030609] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
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
