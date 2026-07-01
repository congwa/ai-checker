/** 业务说明：管理端运行历史组件，展示任务采样结果、错误摘要和评分变化。 */
import { useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { DeleteConfirmIconButton } from "@/components/admin/shared/DeleteConfirmIconButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, StatusIcon } from "@/components/ui/status";
import { Switch } from "@/components/ui/switch";
import { formatScore, getRunStatusLabel } from "@/lib/score";
import { formatDateTime } from "@/lib/utils";
import type { RunView } from "@/types/domain";

interface RunHistoryProps {
  runs: RunView[];
  runPublicUpdatingIds: Set<string>;
  runDeletingIds: Set<string>;
  publicScoreRange: { enabled: boolean; min: number; max: number };
  onSelectRun: (runId: string) => void;
  onTogglePublic: (runId: string, publicEnabled: boolean) => void;
  onSavePublicScore: (runId: string, publicScoreOverride: number) => void;
  onClearPublicScore: (runId: string) => void;
  onDeleteRun: (runId: string) => void;
}

/** 业务说明：渲染近期任务运行列表，让后台用户对成功率、分数和异常摘要一眼可查。 */
export function RunHistory({
  runs,
  runPublicUpdatingIds,
  runDeletingIds,
  publicScoreRange,
  onSelectRun,
  onTogglePublic,
  onSavePublicScore,
  onClearPublicScore,
  onDeleteRun,
}: RunHistoryProps) {
  const [draftScores, setDraftScores] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraftScores(
      Object.fromEntries(
        runs.map((run) => [
          run.id,
          run.public_score_override === null || run.public_score_override === undefined
            ? ""
            : formatDraftScore(run.public_score_override),
        ]),
      ),
    );
  }, [runs]);

  if (runs.length === 0) {
    return <div className="rounded-md border border-dashed border-white/[0.16] bg-white/[0.045] p-6 text-sm text-slate-400">暂无运行记录</div>;
  }
  return (
    <div className="min-w-0 space-y-3">
      {runs.map((run) => {
        const isUpdating = runPublicUpdatingIds.has(run.id);
        const isDeleting = runDeletingIds.has(run.id);
        const isBusy = isUpdating || isDeleting;
        const publicScore = run.public_score ?? run.smooth_score;
        const draftScore = draftScores[run.id] ?? "";
        const parsedDraftScore = draftScore.trim() === "" ? null : Number(draftScore);
        const hasDraftScore = draftScore.trim() !== "";
        const hasScoreOverride = run.public_score_override != null;
        const minAllowed = publicScoreRange.enabled ? publicScoreRange.min : 0;
        const maxAllowed = publicScoreRange.enabled ? publicScoreRange.max : 100;
        const isDraftInvalid =
          parsedDraftScore !== null &&
          (!Number.isFinite(parsedDraftScore) ||
            parsedDraftScore < minAllowed ||
            parsedDraftScore > maxAllowed);

        return (
        <article
          key={run.id}
          className="min-w-0 overflow-hidden rounded-lg border border-white/[0.105] bg-white/[0.05] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:bg-white/[0.075]"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <button
              type="button"
              className="min-w-0 flex-1 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-[#b7f860]/80"
              onClick={() => onSelectRun(run.id)}
            >
              <div>
                <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-100">
                  <StatusIcon status={run.status === "success" ? "success" : "failed"} />
                  <span className="truncate">{formatDateTime(run.completed_at)}</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  成功 {run.success_count} / 失败 {run.failed_count}
                </div>
              </div>
              {run.error_summary ? (
                <p className="mt-2 break-words text-xs leading-5 text-amber-200">{run.error_summary}</p>
              ) : null}
            </button>
            <div className="flex shrink-0 flex-col items-end text-right">
              <div className="rounded-md border border-[#39e6c1]/20 bg-[#39e6c1]/[0.08] px-2 py-1 font-display text-xl font-bold leading-none text-[#b7fff0]">
                {formatScore(run.smooth_score)}
              </div>
              <div className="mt-2">
              <StatusBadge status={run.status === "success" ? "success" : "failed"} label={getRunStatusLabel(run.status)} />
              </div>
              <div className="mt-2 flex justify-end">
                <DeleteConfirmIconButton
                  ariaLabel={`删除 ${formatDateTime(run.completed_at)} 的运行记录`}
                  tooltip="删除记录"
                  title={`删除 ${formatDateTime(run.completed_at)} 的运行记录？`}
                  description="这次测试会从后台历史、真实结果曲线、前台展示结果曲线和公开看板数据中移除。此操作不可撤销。"
                  confirmLabel="删除记录"
                  disabled={isBusy}
                  isDeleting={isDeleting}
                  onConfirm={() => onDeleteRun(run.id)}
                />
              </div>
            </div>
          </div>
          {run.status === "success" ? (
            <div className="mt-3 rounded-md border border-white/[0.105] bg-black/25 p-3">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-300">
                    <Switch
                      checked={run.public_enabled}
                      disabled={isBusy}
                      aria-busy={isBusy}
                      aria-label={`${formatDateTime(run.completed_at)} 前台展示`}
                      onCheckedChange={(checked) => onTogglePublic(run.id, checked)}
                    />
                    <span>{run.public_enabled ? "前台展示" : "前台隐藏"}</span>
                    {isBusy ? <StatusIcon status="running" className="text-[#b7fff0]" /> : null}
                  </label>
                  <StatusBadge status={run.public_enabled ? "info" : "disabled"} label={`前台分 ${formatScore(publicScore)}`} />
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="min-w-[150px] flex-1 text-xs font-medium text-slate-400">
                    前台展示分
                    <Input
                      className="mt-1"
                      type="number"
                      min={minAllowed}
                      max={maxAllowed}
                      step={0.01}
                      value={draftScore}
                      placeholder={formatScore(run.smooth_score)}
                      disabled={!run.public_enabled || isBusy}
                      aria-invalid={isDraftInvalid}
                      onChange={(event) =>
                        setDraftScores((current) => ({
                          ...current,
                          [run.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <Button
                    type="button"
                    size="compact"
                    variant="secondary"
                    disabled={!run.public_enabled || isBusy || isDraftInvalid || parsedDraftScore === null}
                    onClick={() => onSavePublicScore(run.id, parsedDraftScore!)}
                  >
                    <Save className="h-4 w-4" />
                    保存
                  </Button>
                  <Button
                    type="button"
                    size="compact"
                    variant="ghost"
                    disabled={!run.public_enabled || isBusy || (!hasScoreOverride && !hasDraftScore)}
                    onClick={() => {
                      if (hasScoreOverride) {
                        onClearPublicScore(run.id);
                        return;
                      }
                      setDraftScores((current) => ({
                        ...current,
                        [run.id]: "",
                      }));
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    {hasScoreOverride ? "恢复默认" : hasDraftScore ? "清空输入" : "默认分"}
                  </Button>
                </div>
                {isDraftInvalid ? (
                  <p className="text-xs text-rose-200">
                    前台展示分需要在 {formatDraftScore(minAllowed)} 到 {formatDraftScore(maxAllowed)} 之间。
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-md border border-white/[0.12] bg-black/25 px-3 py-2 text-xs text-slate-500">
              失败记录只保留后台诊断，不进入前台展示。
            </div>
          )}
        </article>
        );
      })}
    </div>
  );
}

function formatDraftScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}
