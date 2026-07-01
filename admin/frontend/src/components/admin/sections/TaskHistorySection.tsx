/** 业务说明：任务历史页面区块，承载选中任务的评分看板、分布和运行记录诊断。 */
import { DeleteConfirmIconButton } from "@/components/admin/shared/DeleteConfirmIconButton";
import { DistributionChart } from "@/components/admin/DistributionChart";
import { AdminPanel } from "@/components/admin/layout/AdminPanel";
import { MetricCard } from "@/components/admin/MetricCard";
import { RunHistory } from "@/components/admin/RunHistory";
import { ScoreChart } from "@/components/admin/ScoreChart";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/ui/status";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import { formatScore } from "@/lib/score";
import { formatDateTime } from "@/lib/utils";

interface TaskHistorySectionProps {
  dashboard: AdminDashboardState;
  onEdit: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

/** 业务说明：渲染后台任务历史页，围绕选中任务展示评分看板、分布和运行记录。 */
export function TaskHistorySection({ dashboard, onEdit, onDeleteTask }: TaskHistorySectionProps) {
  if (!dashboard.selectedTask) {
    return (
      <AdminPanel title="任务历史">
        <div className="text-sm text-slate-400">暂无可查看的任务</div>
      </AdminPanel>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 md:grid-cols-3">
        <MetricCard
          title="相似度评分"
          value={formatScore(dashboard.selectedTask.last_smooth_score)}
          tone="text-[#b7fff0]"
        />
        <MetricCard
          title="下次运行"
          value={formatDateTime(dashboard.selectedTask.next_run_at)}
          tone="text-[#f4f7ef]"
        />
        <MetricCard
          title="参照"
          value={
            dashboard.selectedTask.reference_id
              ? dashboard.referenceMap.get(dashboard.selectedTask.reference_id)?.name ?? "参照已删除"
              : "未选择"
          }
          tone="text-[#ffe0a6]"
        />
      </section>

      <section className="relative overflow-hidden rounded-lg border border-white/[0.11] bg-[linear-gradient(135deg,rgba(255,255,255,0.065),rgba(255,255,255,0.022))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:flex md:items-center md:justify-between md:gap-4">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#b7f860] via-[#39e6c1] to-[#ffb84d]" />
        <div>
          <h2 className="font-display text-lg font-semibold text-[#f4f7ef]">{dashboard.selectedTask.name}</h2>
          <div className="mt-1 text-sm text-slate-400">{dashboard.selectedTask.model}</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 md:mt-0 md:justify-end">
          <StatusBadge status={dashboard.selectedTask.enabled ? "success" : "disabled"} label={dashboard.selectedTask.enabled ? "调度中" : "已停用"} />
          <Button variant="secondary" onClick={() => onEdit(dashboard.selectedTask!.id)}>
            编辑任务
          </Button>
          <DeleteConfirmIconButton
            ariaLabel={`删除任务 ${dashboard.selectedTask.name}`}
            tooltip="删除任务"
            buttonLabel="删除任务"
            title={`删除任务「${dashboard.selectedTask.name}」？`}
            description="任务配置会被移除，公开看板将不再展示它。历史记录不会继续作为当前任务更新。此操作不可撤销。"
            confirmLabel="删除任务"
            disabled={dashboard.deletingIds.has(dashboard.selectedTask.id)}
            isDeleting={dashboard.deletingIds.has(dashboard.selectedTask.id)}
            onConfirm={() => onDeleteTask(dashboard.selectedTask!.id)}
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AdminPanel title="真实结果" description="单次运行即时结果，不做平滑处理。">
          <ScoreChart runs={dashboard.runs} variant="actual" />
        </AdminPanel>
        <AdminPanel title="前台展示结果" description="公开页实际展示的相似度评分，受平滑度、显示分区间和单次公开设置影响。">
          <ScoreChart runs={dashboard.runs} variant="public" />
        </AdminPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <AdminPanel title="采样分布">
          {dashboard.selectedRun ? (
            <DistributionChart distribution={dashboard.selectedRun.distribution} />
          ) : (
            <div className="p-8 text-sm text-slate-400">暂无分布</div>
          )}
        </AdminPanel>
        <AdminPanel title="运行历史">
          <ScrollArea className="h-[min(560px,70vh)] pr-3">
            <RunHistory
              runs={dashboard.runs}
              runPublicUpdatingIds={dashboard.runPublicUpdatingIds}
              runDeletingIds={dashboard.runDeletingIds}
              publicScoreRange={{
                enabled: dashboard.selectedTask.public_score_range_enabled,
                min: dashboard.selectedTask.public_score_min,
                max: dashboard.selectedTask.public_score_max,
              }}
              onSelectRun={dashboard.chooseRun}
              onTogglePublic={dashboard.toggleRunPublic}
              onSavePublicScore={dashboard.saveRunPublicScore}
              onClearPublicScore={dashboard.clearRunPublicScore}
              onDeleteRun={dashboard.removeRun}
            />
          </ScrollArea>
        </AdminPanel>
      </section>
    </div>
  );
}
