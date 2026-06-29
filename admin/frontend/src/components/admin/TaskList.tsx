/** 业务说明：管理端任务列表组件，集中展示任务启用状态、公开状态和最新评分。 */
import { FileClock, Pencil, Play, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatScore } from "@/lib/score";
import { cn, formatDateTime } from "@/lib/utils";
import type { ReferenceView, TaskView } from "@/types/domain";

interface TaskListProps {
  tasks: TaskView[];
  referenceMap: Map<string, ReferenceView>;
  selectedTaskId: string | null;
  busyTaskId: string | null;
  onSelect: (taskId: string) => void;
  onRun: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onHistory: (taskId: string) => void;
}

/** 业务说明：渲染任务列表，支持选择、手动运行、查看历史、编辑和删除等后台核心操作。 */
export function TaskList({
  tasks,
  referenceMap,
  selectedTaskId,
  busyTaskId,
  onSelect,
  onRun,
  onDelete,
  onEdit,
  onHistory,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-700 p-8 text-sm text-slate-400">
        暂无任务
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <div className="hidden grid-cols-[minmax(220px,1.4fr)_120px_150px_170px_220px] gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 text-xs font-semibold uppercase text-slate-500 lg:grid">
        <span>任务</span>
        <span>评分</span>
        <span>状态</span>
        <span>下次运行</span>
        <span className="text-right">操作</span>
      </div>
      {tasks.map((task, index) => (
        <motion.article
          key={task.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: index * 0.04 }}
          className={cn(
            "grid gap-3 border-b border-slate-800 bg-slate-950/60 px-4 py-4 transition last:border-b-0 lg:grid-cols-[minmax(220px,1.4fr)_120px_150px_170px_220px] lg:items-center",
            selectedTaskId === task.id ? "bg-teal-300/10" : "hover:bg-slate-900/70",
          )}
        >
          <button className="min-w-0 text-left" onClick={() => onSelect(task.id)}>
            <div className="truncate text-sm font-semibold text-slate-100">{task.name}</div>
            <div className="mt-1 truncate text-xs text-slate-400">{task.model}</div>
            <div className="mt-1 truncate text-xs text-teal-200/80">
              参照：{task.reference_id ? referenceMap.get(task.reference_id)?.name ?? "参照已删除" : "未选择"}
            </div>
          </button>
          <div className="text-2xl font-bold text-teal-200 lg:text-lg">
            {formatScore(task.last_smooth_score)}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={task.enabled ? "success" : "neutral"}>{task.enabled ? "启用" : "停用"}</Badge>
            <Badge tone={task.public_enabled ? "warning" : "neutral"}>
              {task.public_enabled ? "公开" : "私有"}
            </Badge>
          </div>
          <div className="text-xs text-slate-400">{formatDateTime(task.next_run_at)}</div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button className="h-8 px-3" disabled={busyTaskId === task.id} onClick={() => onRun(task.id)}>
              <Play className="h-4 w-4" />
              运行
            </Button>
            <Button className="h-8 px-3" variant="secondary" onClick={() => onHistory(task.id)}>
              <FileClock className="h-4 w-4" />
            </Button>
            <Button className="h-8 px-3" variant="secondary" onClick={() => onEdit(task.id)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button className="h-8 px-3" variant="danger" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
