/** 业务说明：公开看板指标组件，集中展示选中任务的当前评分、状态和更新时间。 */
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn, formatDateTime, formatScore } from "@/lib/utils";
import type { PublicTask } from "@/types/domain";

interface PublicMetricsProps {
  task: PublicTask | null;
}

/** 业务说明：渲染公开看板关键指标组，让观察者在第一屏获得最新任务状态。 */
export function PublicMetrics({ task }: PublicMetricsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
      <Metric title="当前相似度评分" value={formatScore(task?.last_smooth_score)} tone="text-[#06101d]" featured />
      <Metric title="最新状态" value={getPublicTaskStatusLabel(task)} tone="text-[#cfe1ff]" />
      <Metric title="更新时间" value={formatDateTime(task?.updated_at)} tone="text-[#f4f8ff]" />
    </section>
  );
}

/** 业务说明：把公开任务运行状态转成看板用户能直接理解的中文文案。 */
function getPublicTaskStatusLabel(task: PublicTask | null) {
  if (task?.latest_status === "success") return "成功";
  if (task?.latest_status === "failed") return "失败";
  return "待运行";
}

interface MetricProps {
  title: string;
  value: string;
  tone: string;
  featured?: boolean;
}

/** 业务说明：渲染单个公开看板指标卡，保持数字变化时有轻量反馈但不干扰阅读。 */
function Metric({ title, value, tone, featured = false }: MetricProps) {
  return (
    <Card
      className={cn(
        "relative min-h-28 overflow-hidden",
        featured
          ? "border-[#e4f0ff]/65 bg-[linear-gradient(180deg,#dce9f8,#c8ddf4)] text-[#06101d] shadow-[0_20px_62px_rgba(107,168,255,0.18)]"
          : "",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#6ba8ff] via-[#39e6c1] to-[#ffb84d]",
          featured ? "from-[#06101d] via-[#1e6474] to-[#c47a1e]" : "",
        )}
      />
      <div
        className={cn(
          "absolute right-3 top-3 h-10 w-16 rounded-sm border-r border-t border-white/10",
          featured ? "border-[#06101d]/12" : "",
        )}
      />
      <div className={cn("pl-2 text-xs font-semibold text-slate-500", featured ? "text-[#42556b]" : "")}>{title}</div>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-4 pl-2 font-display break-words text-2xl font-bold leading-tight md:text-3xl ${tone}`}
      >
        {value}
      </motion.div>
    </Card>
  );
}
