/** 业务说明：公开看板页头组件，承载品牌识别和只读数据刷新入口。 */
import { ArrowUpRight, Database, RefreshCw, ShieldCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateTime } from "@/lib/utils";
import type { PublicTask } from "@/types/domain";

interface PublicHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  selectedTask: PublicTask | null;
  taskCount: number;
}

/** 业务说明：渲染公开看板顶部入口，让观察者知道当前页面身份并可手动刷新数据。 */
export function PublicHeader({ isLoading, onRefresh, selectedTask, taskCount }: PublicHeaderProps) {
  return (
    <header className="gsap-reveal relative overflow-hidden rounded-lg border border-white/[0.1] bg-[#050807]/[0.84] px-4 py-3 shadow-[0_24px_72px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.055)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(94,234,212,0.84),rgba(251,191,36,0.56),transparent)]" />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <img
            className="h-10 w-10 shrink-0 rounded-md border border-white/[0.1] bg-black/35 object-contain p-1 shadow-[0_0_0_1px_rgba(94,234,212,.22)]"
            src="/codexbuy-logo.png"
            alt=""
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-semibold leading-none text-[#f7fffb] sm:whitespace-nowrap">AI Checker 公开监测</h1>
              <Badge tone="success" className="hidden sm:inline-flex">
                Live
              </Badge>
            </div>
            <div className="mt-2 grid min-w-0 gap-1 text-xs text-[#8fa39c] sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-[#7dd3c7]" />
                {taskCount} 个公开任务
              </span>
              <span className="hidden h-3 w-px bg-white/[0.14] sm:inline-block" />
              <span className="min-w-0 truncate">当前：{selectedTask?.name ?? "等待数据"}</span>
              <span className="hidden h-3 w-px bg-white/[0.14] sm:inline-block" />
              <span className="min-w-0 truncate">{formatDateTime(selectedTask?.updated_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
          <span className="inline-flex h-9 items-center gap-2 rounded-md border border-[#7dd3c7]/25 bg-[#7dd3c7]/[0.08] px-3 text-sm font-semibold text-[#ccfbf1]">
            <ShieldCheck className="h-4 w-4" />
            只读
          </span>
          <Badge tone={selectedTask?.latest_status === "failed" ? "danger" : selectedTask?.latest_status === "success" ? "success" : "neutral"} className="h-9 px-3">
            {selectedTask?.latest_status === "failed" ? "失败" : selectedTask?.latest_status === "success" ? "成功" : "待运行"}
          </Badge>
          <a
            className={cn(buttonVariants({ variant: "secondary" }), "h-9 px-3")}
            href="https://codexbuy.com"
            rel="noreferrer"
            target="_blank"
          >
            官网
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <Button className="h-9 px-3" disabled={isLoading} aria-busy={isLoading} onClick={onRefresh}>
            <RefreshCw className={cn("h-4 w-4", isLoading ? "animate-spin" : "")} />
            {isLoading ? "刷新中" : "刷新"}
          </Button>
        </div>
      </div>
    </header>
  );
}
