/** 业务说明：公开看板页头组件，承载品牌识别和只读数据刷新入口。 */
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
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
      className="flex flex-col gap-4 rounded-lg border border-sky-900/60 bg-slate-950/75 p-5 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-sky-200">
          <img
            className="h-8 w-8 rounded-md object-contain shadow-[0_0_0_1px_rgba(56,189,248,.22)]"
            src="/codexbuy-logo.png"
            alt=""
            aria-hidden="true"
          />
          AI Checker Public
        </div>
      </div>
      <Button disabled={isLoading} aria-busy={isLoading} onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" />
        {isLoading ? "刷新中" : "刷新"}
      </Button>
    </motion.header>
  );
}
