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
    <Card className={compact ? "min-h-20 p-3 sm:min-h-28 sm:p-4" : "min-h-24 sm:min-h-28"}>
      <div className="text-xs font-semibold uppercase text-slate-500">{title}</div>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "break-words font-bold",
          compact ? "mt-3 text-xl sm:mt-4 sm:text-2xl" : "mt-4 text-2xl",
          tone,
        )}
      >
        {value}
      </motion.div>
    </Card>
  );
}
