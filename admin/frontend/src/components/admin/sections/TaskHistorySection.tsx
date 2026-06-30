/** 业务说明：任务历史页面区块，承载选中任务的曲线、分布和运行记录诊断。 */
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
}

/** 业务说明：渲染后台任务历史页，围绕选中任务展示曲线、分布和运行记录。 */
export function TaskHistorySection({ dashboard, onEdit }: TaskHistorySectionProps) {
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
          title="平滑分"
          value={formatScore(dashboard.selectedTask.last_smooth_score)}
          tone="text-teal-200"
        />
        <MetricCard
          title="下次运行"
          value={formatDateTime(dashboard.selectedTask.next_run_at)}
          tone="text-slate-100"
        />
        <MetricCard
          title="参照"
          value={
            dashboard.selectedTask.reference_id
              ? dashboard.referenceMap.get(dashboard.selectedTask.reference_id)?.name ?? "参照已删除"
              : "未选择"
          }
          tone="text-amber-200"
        />
      </section>

      <AdminPanel
        title={dashboard.selectedTask.name}
        description={dashboard.selectedTask.model}
        action={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={dashboard.selectedTask.enabled ? "success" : "disabled"} label={dashboard.selectedTask.enabled ? "调度中" : "已停用"} />
            <Button variant="secondary" onClick={() => onEdit(dashboard.selectedTask!.id)}>
              编辑任务
            </Button>
          </div>
        }
      >
        <ScoreChart runs={dashboard.runs} />
      </AdminPanel>

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
            <RunHistory runs={dashboard.runs} onSelectRun={dashboard.chooseRun} />
          </ScrollArea>
        </AdminPanel>
      </section>
    </div>
  );
}
