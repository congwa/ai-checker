/** 业务说明：管理端任务列表组件，集中展示任务启用状态、公开状态和最新相似度评分。 */
import { FileClock, Pencil, Play } from "lucide-react";
import { motion } from "framer-motion";
import { DeleteConfirmIconButton } from "@/components/admin/shared/DeleteConfirmIconButton";
import { IconActionButton } from "@/components/admin/shared/IconActionButton";
import { RunJobProgress } from "@/components/admin/shared/RunJobProgress";
import { Button } from "@/components/ui/button";
import { StatusBadge, StatusIcon } from "@/components/ui/status";
import { Switch } from "@/components/ui/switch";
import { formatScore } from "@/lib/score";
import { getRunJobTargetKey, isActiveRunJob } from "@/lib/run-jobs";
import { cn, formatDateTime } from "@/lib/utils";
import type { ReferenceView, RunJobView, TaskView } from "@/types/domain";

interface TaskListProps {
  tasks: TaskView[];
  referenceMap: Map<string, ReferenceView>;
  selectedTaskId: string | null;
  runJobByTarget: Map<string, RunJobView>;
  deletingIds: Set<string>;
  publicUpdatingIds: Set<string>;
  onSelect: (taskId: string) => void;
  onRun: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onTogglePublic: (taskId: string, publicEnabled: boolean) => void;
  onEdit: (taskId: string) => void;
  onHistory: (taskId: string) => void;
}

/** 业务说明：渲染任务列表，支持选择、手动运行、查看历史、编辑和删除等后台核心操作。 */
export function TaskList({
  tasks,
  referenceMap,
  selectedTaskId,
  runJobByTarget,
  deletingIds,
  publicUpdatingIds,
  onSelect,
  onRun,
  onDelete,
  onTogglePublic,
  onEdit,
  onHistory,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-white/[0.16] bg-white/[0.045] p-8 text-sm text-slate-400">
        暂无任务。先准备一个成功标定的参照，再添加需要监控的模型任务。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.11] bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="hidden grid-cols-[minmax(220px,1.4fr)_120px_190px_170px_280px] gap-3 border-b border-white/[0.11] bg-white/[0.04] px-4 py-3 text-xs font-semibold text-slate-500 lg:grid">
        <span>任务</span>
        <span>相似度评分</span>
        <span>状态</span>
        <span>下次运行</span>
        <span className="text-right">操作</span>
      </div>
      {tasks.map((task, index) => {
        const reference = task.reference_id ? referenceMap.get(task.reference_id) : undefined;
        const referenceReady = Boolean(reference?.latest_success_run_id);
        const job = runJobByTarget.get(getRunJobTargetKey("task", task.id));
        const isRunning = isActiveRunJob(job);
        const isDeleting = deletingIds.has(task.id);
        const isPublicUpdating = publicUpdatingIds.has(task.id);

        return (
          <motion.article
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: index * 0.04 }}
            className={cn(
              "grid gap-3 border-b border-white/[0.085] bg-transparent px-4 py-4 transition last:border-b-0 lg:grid-cols-[minmax(220px,1.4fr)_120px_190px_170px_280px] lg:items-center",
              selectedTaskId === task.id
                ? "bg-[#b7f860]/[0.075] shadow-[inset_3px_0_0_rgba(183,248,96,0.95)]"
                : "hover:bg-white/[0.04]",
            )}
          >
            <button
              className="min-w-0 cursor-pointer rounded-md text-left focus:outline-none focus:ring-2 focus:ring-[#b7f860]/80"
              aria-pressed={selectedTaskId === task.id}
              onClick={() => onSelect(task.id)}
            >
              <div className="truncate text-sm font-semibold text-slate-50">{task.name}</div>
              <div className="mt-1 truncate text-xs text-slate-400">{task.model}</div>
              <div className="mt-1 truncate text-xs text-[#b7fff0]/85">
                参照：{reference ? reference.name : task.reference_id ? "参照已删除" : "未选择"}
              </div>
              {isRunning && job ? (
                <RunJobProgress job={job} ariaLabel="任务运行进度" fallbackMessage="任务运行中" />
              ) : job?.status === "failed" ? (
                <p className="mt-2 text-xs text-rose-200">{job.error_summary ?? "最近一次运行失败"}</p>
              ) : null}
            </button>
            <div className="w-fit rounded-md border border-[#39e6c1]/25 bg-[#39e6c1]/[0.09] px-3 py-2 font-display text-2xl font-bold leading-none text-[#b7fff0] shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] lg:text-lg">
              {formatScore(task.last_smooth_score)}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={task.enabled ? "success" : "disabled"} label={task.enabled ? "启用" : "停用"} />
                {task.public_score_range_enabled ? (
                  <StatusBadge
                    status="info"
                    label={`区间 ${formatScore(task.public_score_min)}-${formatScore(task.public_score_max)}`}
                  />
                ) : null}
                {!referenceReady ? (
                  <StatusBadge status="warning" label="参照未就绪" />
                ) : null}
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-300">
                <Switch
                  checked={task.public_enabled}
                  disabled={isDeleting || isPublicUpdating}
                  aria-busy={isPublicUpdating}
                  aria-label={`${task.name} 前台展示`}
                  onCheckedChange={(checked) => onTogglePublic(task.id, checked)}
                />
                <span>{task.public_enabled ? "前台展示" : "前台隐藏"}</span>
                {isPublicUpdating ? <StatusIcon status="running" className="text-teal-200" /> : null}
              </label>
            </div>
            <div className="text-xs leading-5 text-slate-400">{formatDateTime(task.next_run_at)}</div>
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
              <DeleteConfirmIconButton
                ariaLabel={`删除任务 ${task.name}`}
                tooltip="删除任务"
                buttonLabel="删除任务"
                title={`删除任务「${task.name}」？`}
                description="任务配置会被移除，公开看板将不再展示它。历史数据不会作为当前任务继续更新。"
                confirmLabel="删除任务"
                disabled={isRunning || isDeleting}
                isDeleting={isDeleting}
                onConfirm={() => onDelete(task.id)}
              />
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
