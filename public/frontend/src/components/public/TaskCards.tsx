/** 业务说明：公开任务卡片组件，展示每个公开任务的最新相似度评分和运行状态。 */
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatScore, cn } from "@/lib/utils";
import type { PublicTask } from "@/types/domain";

interface TaskCardsProps {
  tasks: PublicTask[];
  selectedTaskId: string | null;
  onSelect: (taskId: string) => void;
}

/** 业务说明：渲染公开任务列表，点击任务后展示对应评分曲线。 */
export function TaskCards({ tasks, selectedTaskId, onSelect }: TaskCardsProps) {
  if (tasks.length === 0) {
    return <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.04] p-8 text-sm text-slate-400">暂无</div>;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
      {tasks.map((task, index) => (
        <motion.button
          key={task.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: index * 0.05 }}
          onClick={() => onSelect(task.id)}
          className={cn(
            "relative overflow-hidden rounded-lg border p-4 text-left shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition-[background-color,border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-sky-200/80",
            selectedTaskId === task.id
              ? "border-sky-200/40 bg-sky-300/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_50px_rgba(14,165,233,0.12)]"
              : "border-white/10 bg-[#0b1420]/[0.78] hover:border-sky-300/30 hover:bg-white/[0.07]",
          )}
        >
          {selectedTaskId === task.id ? <span className="absolute inset-x-0 top-0 h-px bg-sky-200/80" /> : null}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-100">
                <Activity className="h-4 w-4 text-sky-300" />
                {task.name}
              </div>
              <div className="mt-1 text-xs text-slate-400">{task.model}</div>
            </div>
            <motion.div key={task.last_smooth_score ?? "empty"} initial={{ scale: 0.96, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="rounded-md border border-teal-300/20 bg-teal-300/10 px-2 py-1 text-3xl font-bold leading-none text-teal-100">
              {formatScore(task.last_smooth_score)}
            </motion.div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={task.latest_status === "success" ? "success" : task.latest_status === "failed" ? "danger" : "neutral"}>
              {task.latest_status === "success" ? "成功" : task.latest_status === "failed" ? "失败" : "待运行"}
            </Badge>
            <Badge tone={task.enabled ? "warning" : "neutral"}>{task.enabled ? "调度中" : "已停用"}</Badge>
          </div>
          <div className="mt-3 text-xs text-slate-500">{formatDateTime(task.updated_at)}</div>
        </motion.button>
      ))}
    </div>
  );
}
