/** 业务说明：后台全局运行队列组件，集中展示所有仍在执行的参照标定和任务采样。 */
import { useMemo } from "react";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/ui/status";
import { getRunJobProgress, isActiveRunJob } from "@/lib/run-jobs";
import { formatDateTime } from "@/lib/utils";
import type { ReferenceView, RunJobView, TaskView } from "@/types/domain";

interface ActiveRunJobsPanelProps {
  jobs: RunJobView[];
  tasks: TaskView[];
  references: ReferenceView[];
  onOpenTask: (taskId: string) => void;
  onOpenReferences: () => void;
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
  const activeJobs = useMemo(() => jobs.filter(isActiveRunJob), [jobs]);
  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const referenceMap = useMemo(
    () => new Map(references.map((reference) => [reference.id, reference])),
    [references],
  );

  if (activeJobs.length === 0) return null;

  return (
    <section
      className="mt-5 rounded-lg border border-[#b7f860]/25 bg-[#b7f860]/[0.07] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_18px_50px_rgba(183,248,96,0.08)]"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#efffbb]">
          <Activity className="h-4 w-4 text-[#b7f860]" />
          后台运行中
        </div>
        <div className="text-xs text-slate-400">{activeJobs.length} 个操作正在等待结果</div>
      </div>

      <ScrollArea className="mt-3 max-h-[280px] pr-3">
        <div className="grid gap-3 xl:grid-cols-2">
          {activeJobs.map((job) => {
            const progress = getRunJobProgress(job);
            const targetName = getJobTargetName(job, taskMap, referenceMap);

            return (
              <article key={job.id} className="rounded-md border border-white/[0.12] bg-black/25 p-3">
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
                    size="compact"
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
                  <Progress value={progress.percent} aria-label={`${targetName} 运行进度`} />
                  <div className="text-slate-500">最近更新：{formatDateTime(job.updated_at)}</div>
                </div>
              </article>
            );
          })}
        </div>
      </ScrollArea>
    </section>
  );
}
