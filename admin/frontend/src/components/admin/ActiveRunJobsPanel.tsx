/** 业务说明：后台全局运行队列组件，集中展示所有仍在执行的参照标定和任务采样。 */
import { useMemo } from "react";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status";
import { formatDateTime } from "@/lib/utils";
import type { ReferenceView, RunJobView, TaskView } from "@/types/domain";

interface ActiveRunJobsPanelProps {
  jobs: RunJobView[];
  tasks: TaskView[];
  references: ReferenceView[];
  onOpenTask: (taskId: string) => void;
  onOpenReferences: () => void;
}

/** 业务说明：判断 Job 是否仍需要用户等待，避免成功或失败的历史状态占据运行队列。 */
function isActiveJob(job: RunJobView) {
  return job.status === "queued" || job.status === "running";
}

/** 业务说明：计算 Job 进度百分比，兼容刚排队时总数或当前数还未稳定的状态。 */
function getJobProgress(job: RunJobView) {
  const total = Math.max(job.progress_total, 1);
  const current = Math.min(Math.max(job.progress_current, 0), total);
  return {
    total,
    current,
    percent: Math.min(100, Math.round((current / total) * 100)),
  };
}

/** 业务说明：解析 Job 目标名称，让全局队列能清楚指向正在运行的参照或任务。 */
function getJobTargetName(
  job: RunJobView,
  taskMap: Map<string, TaskView>,
  referenceMap: Map<string, ReferenceView>,
) {
  if (job.kind === "reference") return referenceMap.get(job.target_id)?.name ?? "参照已删除";
  return taskMap.get(job.target_id)?.name ?? "任务已删除";
}

/** 业务说明：渲染所有活跃运行 Job，让管理员在任何页面都能看到等待状态和当前进度。 */
export function ActiveRunJobsPanel({
  jobs,
  tasks,
  references,
  onOpenTask,
  onOpenReferences,
}: ActiveRunJobsPanelProps) {
  const activeJobs = useMemo(() => jobs.filter(isActiveJob), [jobs]);
  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const referenceMap = useMemo(
    () => new Map(references.map((reference) => [reference.id, reference])),
    [references],
  );

  if (activeJobs.length === 0) return null;

  return (
    <section
      className="mt-5 rounded-lg border border-teal-400/20 bg-teal-400/5 p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-teal-100">
          <Activity className="h-4 w-4 text-teal-300" />
          后台运行中
        </div>
        <div className="text-xs text-slate-400">{activeJobs.length} 个操作正在等待结果</div>
      </div>

      <div className="mt-3 grid max-h-[280px] gap-3 overflow-auto pr-1 xl:grid-cols-2">
        {activeJobs.map((job) => {
          const progress = getJobProgress(job);
          const targetName = getJobTargetName(job, taskMap, referenceMap);

          return (
            <article key={job.id} className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={job.status === "queued" ? "queued" : "running"} />
                    <span className="text-xs text-slate-400">
                      {job.kind === "reference" ? "参照标定" : "任务采样"}
                    </span>
                  </div>
                  <div className="mt-2 truncate text-sm font-semibold text-slate-100">{targetName}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {job.message ?? "后台已接收，正在等待最新进度"}
                  </div>
                </div>

                <Button
                  className="h-11 px-3 lg:h-8"
                  variant="secondary"
                  onClick={() => (job.kind === "reference" ? onOpenReferences() : onOpenTask(job.target_id))}
                >
                  查看
                </Button>
              </div>

              <div className="mt-3 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span>
                    {progress.current}/{progress.total}
                  </span>
                  <span className="text-slate-400">
                    {job.success_count} 成功 / {job.failed_count} 失败
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded bg-slate-800"
                  role="progressbar"
                  aria-label={`${targetName} 运行进度`}
                  aria-valuemin={0}
                  aria-valuemax={progress.total}
                  aria-valuenow={progress.current}
                >
                  <div
                    className="h-full rounded bg-teal-300 transition-all"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <div className="text-slate-500">最近更新：{formatDateTime(job.updated_at)}</div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
