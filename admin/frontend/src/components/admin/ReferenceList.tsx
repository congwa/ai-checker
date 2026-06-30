/** 业务说明：参照列表组件，展示参照配置、最新标定状态并提供运行/删除操作。 */
import { AlertTriangle, CheckCircle2, Clock3, Crosshair, Loader2, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import type { ReferenceView, RunJobView } from "@/types/domain";

interface ReferenceListProps {
  references: ReferenceView[];
  runJobByTarget: Map<string, RunJobView>;
  deletingIds: Set<string>;
  onRun: (referenceId: string) => void;
  onDelete: (referenceId: string) => void;
}

type ReferenceStatus = "running" | "calibrated" | "failed" | "pending";

/** 业务说明：根据参照和当前 Job 判断业务状态，避免失败标定被误当成可用基准。 */
function getReferenceStatus(reference: ReferenceView, job: RunJobView | undefined): ReferenceStatus {
  if (job?.status === "queued" || job?.status === "running") return "running";
  if (job?.status === "failed" || reference.latest_run_status === "failed") return "failed";
  if (reference.latest_success_run_id) return "calibrated";
  return "pending";
}

/** 业务说明：把参照业务状态转换成用户能扫读的标签文案。 */
function getReferenceStatusLabel(status: ReferenceStatus) {
  if (status === "running") return "运行中";
  if (status === "calibrated") return "已标定";
  if (status === "failed") return "运行失败";
  return "待运行";
}

/** 业务说明：确认删除参照，避免误删任务后续需要选择的比较基准。 */
function confirmDeleteReference(reference: ReferenceView, onDelete: (referenceId: string) => void) {
  if (window.confirm(`确认删除参照「${reference.name}」？已保存的历史运行记录会保留用于审计。`)) {
    onDelete(reference.id);
  }
}

/** 业务说明：渲染参照运行进度，帮助用户确认长时间等待仍在推进。 */
function ReferenceJobProgress({ job }: { job: RunJobView }) {
  const total = Math.max(job.progress_total, 1);
  const percent = Math.min(100, Math.round((job.progress_current / total) * 100));

  return (
    <div className="mt-2 space-y-2 text-xs text-slate-300">
      <div className="flex items-center justify-between gap-3">
        <span>{job.message ?? "参照运行中"}</span>
        <span className="text-slate-400">
          {job.success_count} 成功 / {job.failed_count} 失败
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-slate-800">
        <div className="h-full rounded bg-teal-300 transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
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
      <div className="hidden grid-cols-[minmax(220px,1fr)_160px_150px_180px] gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 text-xs font-semibold uppercase text-slate-500 lg:grid">
        <span>参照</span>
        <span>标定状态</span>
        <span>标定次数</span>
        <span className="text-right">操作</span>
      </div>
      {references.map((reference) => {
        const job = runJobByTarget.get(`reference:${reference.id}`);
        const status = getReferenceStatus(reference, job);
        const isRunning = status === "running";
        const isDeleting = deletingIds.has(reference.id);
        const StatusIcon =
          status === "calibrated" ? CheckCircle2 : status === "failed" ? AlertTriangle : Clock3;

        return (
          <article
            key={reference.id}
            className="grid gap-3 border-b border-slate-800 bg-slate-950/60 px-4 py-4 last:border-b-0 hover:bg-slate-900/50 lg:grid-cols-[minmax(220px,1fr)_160px_150px_190px] lg:items-center"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 truncate text-sm font-semibold text-slate-100">
                <Crosshair className="h-4 w-4 text-teal-300" />
                {reference.name}
              </div>
              <div className="mt-1 truncate text-xs text-slate-400">{reference.model}</div>
              {job && (job.status === "queued" || job.status === "running") ? (
                <ReferenceJobProgress job={job} />
              ) : job?.status === "failed" || (status === "failed" && job?.error_summary) ? (
                <p className="mt-2 text-xs text-rose-200">{job?.error_summary ?? "最近一次标定失败"}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                tone={
                  status === "calibrated" ? "success" : status === "failed" ? "danger" : "warning"
                }
              >
                <StatusIcon className="mr-1 h-3.5 w-3.5" />
                {getReferenceStatusLabel(status)}
              </Badge>
            </div>
            <div className="text-xs text-slate-400">
              {reference.sample_count} 次 / {formatDateTime(reference.updated_at)}
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                className="h-8 px-3"
                disabled={isRunning || isDeleting}
                aria-busy={isRunning}
                onClick={() => onRun(reference.id)}
              >
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isRunning ? "运行中" : status === "failed" ? "重试参照" : "运行参照"}
              </Button>
              <Button
                className="h-8 w-8 px-0"
                variant="danger"
                disabled={isRunning || isDeleting}
                aria-label={`删除参照 ${reference.name}`}
                title={`删除参照 ${reference.name}`}
                onClick={() => confirmDeleteReference(reference, onDelete)}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
