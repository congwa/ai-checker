/** 业务说明：后台指标卡组件，展示当前任务的平滑分、下次运行和参照状态。 */
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  tone: string;
}

/** 业务说明：渲染顶部关键指标卡片，帮助管理员快速掌握当前任务状态。 */
export function MetricCard({ title, value, tone }: MetricCardProps) {
  return (
    <Card className="min-h-28">
      <div className="text-xs font-semibold uppercase text-slate-500">{title}</div>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-4 break-words text-2xl font-bold ${tone}`}
      >
        {value}
      </motion.div>
    </Card>
  );
}
