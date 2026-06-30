/** 业务说明：管理端运行历史组件，展示任务采样结果、错误摘要和评分变化。 */
import { StatusBadge, StatusIcon } from "@/components/ui/status";
import { formatScore, getRunStatusLabel } from "@/lib/score";
import { formatDateTime } from "@/lib/utils";
import type { RunView } from "@/types/domain";

interface RunHistoryProps {
  runs: RunView[];
  onSelectRun: (runId: string) => void;
}

/** 业务说明：渲染近期任务运行列表，让后台用户对成功率、分数和异常摘要一眼可查。 */
export function RunHistory({ runs, onSelectRun }: RunHistoryProps) {
  if (runs.length === 0) {
    return <div className="rounded-md border border-dashed border-slate-700 p-6 text-sm text-slate-400">暂无运行记录</div>;
  }
  return (
    <div className="space-y-3">
      {runs.map((run) => (
        <article key={run.id} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <button className="w-full text-left" onClick={() => onSelectRun(run.id)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <StatusIcon status={run.status === "success" ? "success" : "failed"} />
                  {formatDateTime(run.completed_at)}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  成功 {run.success_count} / 失败 {run.failed_count}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-slate-100">{formatScore(run.smooth_score)}</div>
                <StatusBadge status={run.status === "success" ? "success" : "failed"} label={getRunStatusLabel(run.status)} />
              </div>
            </div>
            {run.error_summary ? <p className="mt-2 text-xs text-amber-200">{run.error_summary}</p> : null}
          </button>
        </article>
      ))}
    </div>
  );
}
