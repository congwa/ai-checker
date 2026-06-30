/** 业务说明：参照列表组件，展示参照配置、最新标定状态并提供运行/删除操作。 */
import { Crosshair, Play } from "lucide-react";
import { DeleteConfirmIconButton } from "@/components/admin/shared/DeleteConfirmIconButton";
import { RunJobProgress } from "@/components/admin/shared/RunJobProgress";
import { Button } from "@/components/ui/button";
import { StatusBadge, StatusIcon } from "@/components/ui/status";
import { getReferenceStatus, getReferenceStatusKind, getReferenceStatusLabel } from "@/lib/reference-status";
import { getRunJobTargetKey } from "@/lib/run-jobs";
import { formatDateTime } from "@/lib/utils";
import type { ReferenceView, RunJobView } from "@/types/domain";

interface ReferenceListProps {
  references: ReferenceView[];
  runJobByTarget: Map<string, RunJobView>;
  deletingIds: Set<string>;
  onRun: (referenceId: string) => void;
  onDelete: (referenceId: string) => void;
}

/** 业务说明：渲染参照配置表，帮助用户先标定基准再创建监控任务。 */
export function ReferenceList({
  references,
  runJobByTarget,
  deletingIds,
  onRun,
  onDelete,
}: ReferenceListProps) {
  if (references.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-700 bg-slate-900/40 p-8 text-sm text-slate-400">
        暂无参照。先新增并成功运行一个参照，再创建任务作为比较基准。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <div className="hidden grid-cols-[minmax(170px,1fr)_118px_120px_150px] gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 text-xs font-semibold uppercase text-slate-500 lg:grid">
        <span>参照</span>
        <span>标定状态</span>
        <span>标定次数</span>
        <span className="text-right">操作</span>
      </div>
      {references.map((reference) => {
        const job = runJobByTarget.get(getRunJobTargetKey("reference", reference.id));
        const status = getReferenceStatus(reference, job);
        const isRunning = status === "running";
        const isDeleting = deletingIds.has(reference.id);

        return (
          <article
            key={reference.id}
            className="grid gap-3 border-b border-slate-800 bg-slate-950/60 px-4 py-4 last:border-b-0 hover:bg-slate-900/50 lg:grid-cols-[minmax(170px,1fr)_118px_120px_150px] lg:items-center"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 truncate text-sm font-semibold text-slate-100">
                <Crosshair className="h-4 w-4 text-teal-300" />
                {reference.name}
              </div>
              <div className="mt-1 truncate text-xs text-slate-400">{reference.model}</div>
              {job && (job.status === "queued" || job.status === "running") ? (
                <RunJobProgress job={job} ariaLabel="参照运行进度" fallbackMessage="参照运行中" />
              ) : job?.status === "failed" || (status === "failed" && job?.error_summary) ? (
                <p className="mt-2 text-xs text-rose-200">{job?.error_summary ?? "最近一次标定失败"}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={getReferenceStatusKind(status)} label={getReferenceStatusLabel(status)} />
            </div>
            <div className="text-xs text-slate-400">
              {reference.sample_count} 次 / {formatDateTime(reference.updated_at)}
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                size="compact"
                disabled={isRunning || isDeleting}
                aria-busy={isRunning}
                onClick={() => onRun(reference.id)}
              >
                {isRunning ? <StatusIcon status="running" /> : <Play className="h-4 w-4" />}
                {isRunning ? "运行中" : status === "failed" ? "重试参照" : "运行参照"}
              </Button>
              <DeleteConfirmIconButton
                ariaLabel={`删除参照 ${reference.name}`}
                tooltip="删除参照"
                title={`删除参照「${reference.name}」？`}
                description="参照配置会被移除，已保存的历史运行记录仍保留用于审计。依赖它的新任务需要重新选择可用基准。"
                confirmLabel="删除参照"
                disabled={isRunning || isDeleting}
                isDeleting={isDeleting}
                onConfirm={() => onDelete(reference.id)}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
