/** 业务说明：参照列表组件，展示参照配置、最新标定状态并提供运行/删除操作。 */
import { Crosshair, Play, Trash2 } from "lucide-react";
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
import { StatusBadge, StatusIcon, type StatusKind } from "@/components/ui/status";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

/** 业务说明：把参照业务状态映射到统一状态图标，保证标定页和全局队列语义一致。 */
function getReferenceStatusKind(status: ReferenceStatus): StatusKind {
  if (status === "running") return "running";
  if (status === "calibrated") return "success";
  if (status === "failed") return "failed";
  return "pending";
}

/** 业务说明：渲染参照运行进度，帮助用户确认长时间等待仍在推进。 */
function ReferenceJobProgress({ job }: { job: RunJobView }) {
  const total = Math.max(job.progress_total, 1);
  const current = Math.min(job.progress_current, total);
  const percent = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="mt-2 space-y-2 text-xs text-slate-300">
      <div className="flex items-center justify-between gap-3">
        <span>{job.message ?? "参照运行中"}</span>
        <span className="text-slate-400">
          {job.success_count} 成功 / {job.failed_count} 失败
        </span>
      </div>
      <Progress value={percent} aria-label={`参照运行进度 ${current}/${total}`} />
    </div>
  );
}

interface DeleteReferenceDialogProps {
  reference: ReferenceView;
  isDisabled: boolean;
  isDeleting: boolean;
  onDelete: (referenceId: string) => void;
}

/** 业务说明：渲染参照删除确认，明确历史记录保留但该参照不再能作为新任务基准。 */
function DeleteReferenceDialog({
  reference,
  isDisabled,
  isDeleting,
  onDelete,
}: DeleteReferenceDialogProps) {
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="danger"
              disabled={isDisabled}
              aria-label={`删除参照 ${reference.name}`}
            >
              {isDeleting ? <StatusIcon status="running" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>删除参照</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除参照「{reference.name}」？</AlertDialogTitle>
          <AlertDialogDescription>
            参照配置会被移除，已保存的历史运行记录仍保留用于审计。依赖它的新任务需要重新选择可用基准。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={() => onDelete(reference.id)}>删除参照</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
      <div className="hidden grid-cols-[minmax(170px,1fr)_118px_120px_150px] gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 text-xs font-semibold uppercase text-slate-500 lg:grid">
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
                <ReferenceJobProgress job={job} />
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
              <DeleteReferenceDialog
                reference={reference}
                isDisabled={isRunning || isDeleting}
                isDeleting={isDeleting}
                onDelete={onDelete}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
