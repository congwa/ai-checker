/** 业务说明：管理端任务列表组件，集中展示任务启用状态、公开状态和最新评分。 */
import type { ReactNode } from "react";
import { FileClock, Pencil, Play, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, StatusIcon } from "@/components/ui/status";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatScore } from "@/lib/score";
import { cn, formatDateTime } from "@/lib/utils";
import type { ReferenceView, RunJobView, TaskView } from "@/types/domain";

interface TaskListProps {
  tasks: TaskView[];
  referenceMap: Map<string, ReferenceView>;
  selectedTaskId: string | null;
  runJobByTarget: Map<string, RunJobView>;
  deletingIds: Set<string>;
  onSelect: (taskId: string) => void;
  onRun: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onHistory: (taskId: string) => void;
}

/** 业务说明：渲染任务运行进度，帮助管理员确认手动采样没有卡死。 */
function TaskJobProgress({ job }: { job: RunJobView }) {
  const total = Math.max(job.progress_total, 1);
  const current = Math.min(job.progress_current, total);
  const percent = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="mt-2 space-y-2 text-xs text-slate-300">
      <div className="flex items-center justify-between gap-3">
        <span>{job.message ?? "任务运行中"}</span>
        <span className="text-slate-400">
          {job.success_count} 成功 / {job.failed_count} 失败
        </span>
      </div>
      <Progress value={percent} aria-label={`任务运行进度 ${current}/${total}`} />
    </div>
  );
}

interface IconActionButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
}

/** 业务说明：渲染带解释的图标操作，避免后台列表中仅靠图标造成误点或理解成本。 */
function IconActionButton({ label, onClick, children }: IconActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          aria-label={label}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

interface DeleteTaskDialogProps {
  task: TaskView;
  isDisabled: boolean;
  isDeleting: boolean;
  onDelete: (taskId: string) => void;
}

/** 业务说明：渲染任务删除确认，提醒用户该任务会从公开看板和后台列表中移除。 */
function DeleteTaskDialog({ task, isDisabled, isDeleting, onDelete }: DeleteTaskDialogProps) {
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="danger"
              disabled={isDisabled}
              aria-label={`删除任务 ${task.name}`}
            >
              {isDeleting ? <StatusIcon status="running" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>删除任务</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除任务「{task.name}」？</AlertDialogTitle>
          <AlertDialogDescription>
            任务配置会被移除，公开看板将不再展示它。历史数据不会作为当前任务继续更新。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={() => onDelete(task.id)}>删除任务</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** 业务说明：渲染任务列表，支持选择、手动运行、查看历史、编辑和删除等后台核心操作。 */
export function TaskList({
  tasks,
  referenceMap,
  selectedTaskId,
  runJobByTarget,
  deletingIds,
  onSelect,
  onRun,
  onDelete,
  onEdit,
  onHistory,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-700 bg-slate-900/40 p-8 text-sm text-slate-400">
        暂无任务。先准备一个成功标定的参照，再添加需要监控的模型任务。
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
      {tasks.map((task, index) => {
        const reference = task.reference_id ? referenceMap.get(task.reference_id) : undefined;
        const referenceReady = Boolean(reference?.latest_success_run_id);
        const job = runJobByTarget.get(`task:${task.id}`);
        const isRunning = job?.status === "queued" || job?.status === "running";
        const isDeleting = deletingIds.has(task.id);

        return (
          <motion.article
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: index * 0.04 }}
            className={cn(
              "grid gap-3 border-b border-slate-800 bg-slate-950/60 px-4 py-4 transition last:border-b-0 lg:grid-cols-[minmax(220px,1.4fr)_120px_170px_170px_240px] lg:items-center",
              selectedTaskId === task.id ? "bg-teal-300/10" : "hover:bg-slate-900/70",
            )}
          >
            <button
              className="min-w-0 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-teal-300"
              aria-pressed={selectedTaskId === task.id}
              onClick={() => onSelect(task.id)}
            >
              <div className="truncate text-sm font-semibold text-slate-100">{task.name}</div>
              <div className="mt-1 truncate text-xs text-slate-400">{task.model}</div>
              <div className="mt-1 truncate text-xs text-teal-200/80">
                参照：{reference ? reference.name : task.reference_id ? "参照已删除" : "未选择"}
              </div>
              {isRunning && job ? (
                <TaskJobProgress job={job} />
              ) : job?.status === "failed" ? (
                <p className="mt-2 text-xs text-rose-200">{job.error_summary ?? "最近一次运行失败"}</p>
              ) : null}
            </button>
            <div className="text-2xl font-bold text-teal-200 lg:text-lg">
              {formatScore(task.last_smooth_score)}
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={task.enabled ? "success" : "disabled"} label={task.enabled ? "启用" : "停用"} />
              <StatusBadge status={task.public_enabled ? "info" : "disabled"} label={task.public_enabled ? "公开" : "私有"} />
              {!referenceReady ? (
                <StatusBadge status="warning" label="参照未就绪" />
              ) : null}
            </div>
            <div className="text-xs text-slate-400">{formatDateTime(task.next_run_at)}</div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                size="compact"
                variant={referenceReady ? "primary" : "secondary"}
                disabled={isRunning || isDeleting || !referenceReady}
                aria-busy={isRunning}
                aria-label={referenceReady ? `运行任务 ${task.name}` : `任务 ${task.name} 的参照未就绪`}
                onClick={() => onRun(task.id)}
              >
                {isRunning ? (
                  <StatusIcon status="running" />
                ) : referenceReady ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <StatusIcon status="warning" />
                )}
                {isRunning ? "运行中" : referenceReady ? "运行" : "参照未就绪"}
              </Button>
              <IconActionButton label={`查看任务历史 ${task.name}`} onClick={() => onHistory(task.id)}>
                <FileClock className="h-4 w-4" />
              </IconActionButton>
              <IconActionButton label={`编辑任务 ${task.name}`} onClick={() => onEdit(task.id)}>
                <Pencil className="h-4 w-4" />
              </IconActionButton>
              <DeleteTaskDialog
                task={task}
                isDisabled={isRunning || isDeleting}
                isDeleting={isDeleting}
                onDelete={onDelete}
              />
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
