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
    return <div className="rounded-lg border border-dashed border-white/[0.16] bg-white/[0.045] p-8 text-sm text-slate-400">暂无</div>;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {tasks.map((task, index) => (
        <motion.button
          key={task.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: index * 0.05 }}
          onClick={() => onSelect(task.id)}
          className={cn(
            "relative overflow-hidden rounded-lg border p-4 text-left shadow-[0_18px_54px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)] transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-[#6ba8ff]/75 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
            selectedTaskId === task.id
              ? "border-[#6ba8ff]/[0.45] bg-[#6ba8ff]/[0.12] shadow-[inset_3px_0_0_rgba(107,168,255,0.95),0_18px_54px_rgba(107,168,255,0.1)]"
              : "border-white/[0.11] bg-[linear-gradient(180deg,rgba(13,21,25,0.9),rgba(5,9,12,0.88))] hover:border-[#6ba8ff]/[0.35] hover:bg-white/[0.07]",
          )}
        >
          {selectedTaskId === task.id ? <span className="absolute inset-x-0 top-0 h-px bg-[#6ba8ff]" /> : null}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-100">
                <Activity className="h-4 w-4 text-[#6ba8ff]" />
                <span className="truncate">{task.name}</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">{task.model}</div>
            </div>
            <motion.div
              key={task.last_smooth_score ?? "empty"}
              initial={{ scale: 0.96, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-md border border-[#39e6c1]/25 bg-[#39e6c1]/[0.1] px-2 py-1 font-display text-3xl font-bold leading-none text-[#b7fff0]"
            >
              {formatScore(task.last_smooth_score)}
            </motion.div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={task.latest_status === "success" ? "success" : task.latest_status === "failed" ? "danger" : "neutral"}>
              {task.latest_status === "success" ? "成功" : task.latest_status === "failed" ? "失败" : "待运行"}
            </Badge>
            <Badge tone={task.enabled ? "warning" : "neutral"}>{task.enabled ? "调度中" : "已停用"}</Badge>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={cn(
                  "h-full rounded-full",
                  task.latest_status === "failed"
                    ? "bg-rose-300/70"
                    : task.latest_status === "success"
                      ? "bg-gradient-to-r from-[#6ba8ff] via-[#39e6c1] to-[#ffb84d]"
                      : "bg-white/25",
                )}
                style={{ width: `${Math.max(8, Math.min(100, task.last_smooth_score ?? 0))}%` }}
              />
            </div>
            <div className="text-xs text-slate-500">{formatDateTime(task.updated_at)}</div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
