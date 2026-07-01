/** 业务说明：后台指标卡组件，展示当前任务的相似度评分、下次运行和参照状态。 */
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  tone: string;
  compact?: boolean;
}

/** 业务说明：渲染顶部关键指标卡片，帮助管理员快速掌握当前任务状态。 */
export function MetricCard({ title, value, tone, compact = false }: MetricCardProps) {
  return (
    <Card
      className={cn(
        "relative min-w-0 overflow-hidden",
        compact ? "min-h-24 p-3 sm:min-h-28 sm:p-4" : "min-h-[7.5rem]",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#b7f860] via-[#39e6c1] to-[#ffb84d]" />
      <div className="absolute right-3 top-3 grid grid-cols-4 gap-1 opacity-55" aria-hidden="true">
        {[12, 20, 15, 26].map((height, index) => (
          <span
            key={index}
            className="w-1 rounded-full bg-white/20"
            style={{ height }}
          />
        ))}
      </div>
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "font-display break-words font-bold leading-tight",
          compact ? "mt-3 text-xl sm:mt-4 sm:text-2xl" : "mt-4 text-2xl md:text-3xl",
          tone,
        )}
      >
        {value}
      </motion.div>
      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        <span className="h-1 w-10 rounded-full bg-[#b7f860]" />
        <span className="h-1 w-5 rounded-full bg-[#39e6c1]" />
        <span className="h-1 w-3 rounded-full bg-[#ffb84d]" />
      </div>
    </Card>
  );
}
