/** 业务说明：任务列表页面区块，承载任务指标、任务列表和新增任务入口。 */
import { AdminPanel } from "@/components/admin/layout/AdminPanel";
import { MetricCard } from "@/components/admin/MetricCard";
import { TaskList } from "@/components/admin/TaskList";
import { Button } from "@/components/ui/button";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import { formatScore } from "@/lib/score";

interface TaskListSectionProps {
  dashboard: AdminDashboardState;
  onAdd: () => void;
  onEdit: (taskId: string) => void;
  onHistory: (taskId: string) => void;
}

/** 业务说明：渲染后台任务列表页，集中完成任务选择、运行、编辑和删除操作。 */
export function TaskListSection({ dashboard, onAdd, onEdit, onHistory }: TaskListSectionProps) {
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-3 gap-3 sm:gap-5">
        <MetricCard compact title="任务数" value={String(dashboard.tasks.length)} tone="text-slate-100" />
        <MetricCard
          compact
          title="公开任务"
          value={String(dashboard.tasks.filter((task) => task.public_enabled).length)}
          tone="text-sky-200"
        />
        <MetricCard
          compact
          title="当前相似度评分"
          value={formatScore(dashboard.selectedTask?.last_smooth_score)}
          tone="text-teal-200"
        />
      </section>

      <AdminPanel title="任务列表" action={<Button onClick={onAdd}>添加任务</Button>}>
        <TaskList
          tasks={dashboard.tasks}
          referenceMap={dashboard.referenceMap}
          selectedTaskId={dashboard.selectedTaskId}
          runJobByTarget={dashboard.runJobByTarget}
          deletingIds={dashboard.deletingIds}
          onSelect={dashboard.setSelectedTaskId}
          onRun={dashboard.runNow}
          onDelete={dashboard.removeTask}
          onEdit={onEdit}
          onHistory={onHistory}
        />
      </AdminPanel>
    </div>
  );
}
