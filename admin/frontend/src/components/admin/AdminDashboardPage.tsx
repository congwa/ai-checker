/** 业务说明：后台工作台页面，整合任务配置、评分曲线、运行历史和分布诊断。 */
import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, X } from "lucide-react";
import { ActiveRunJobsPanel } from "@/components/admin/ActiveRunJobsPanel";
import { DistributionChart } from "@/components/admin/DistributionChart";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { AdminPanel } from "@/components/admin/layout/AdminPanel";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { OperationNoticePanel } from "@/components/admin/layout/OperationNoticePanel";
import { MetricCard } from "@/components/admin/MetricCard";
import { ReferenceForm } from "@/components/admin/ReferenceForm";
import { ReferenceList } from "@/components/admin/ReferenceList";
import { RunHistory } from "@/components/admin/RunHistory";
import { ScoreChart } from "@/components/admin/ScoreChart";
import { TaskForm } from "@/components/admin/TaskForm";
import { TaskList } from "@/components/admin/TaskList";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status";
import type { AdminSection } from "@/lib/config/navigation";
import { formatScore } from "@/lib/score";
import { formatDateTime } from "@/lib/utils";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";

interface AdminDashboardPageProps {
  token: string;
  onLogout: () => void;
}

/** 业务说明：渲染登录后的后台管理工作台，管理员可完成配置、运行和诊断。 */
export function AdminDashboardPage({ token, onLogout }: AdminDashboardPageProps) {
  const dashboard = useAdminDashboard(token);
  const [activeSection, setActiveSection] = useState<AdminSection>("references");

  /** 业务说明：切换到指定任务的历史页，保持历史记录和曲线与任务选择一致。 */
  function openHistory(taskId: string) {
    dashboard.setSelectedTaskId(taskId);
    setActiveSection("history");
  }

  /** 业务说明：切换到指定任务的编辑页，复用任务配置表单更新现有任务。 */
  function openEdit(taskId: string) {
    dashboard.setSelectedTaskId(taskId);
    setActiveSection("edit");
  }

  /** 业务说明：从全局运行队列跳到任务列表，并保持目标任务处于选中状态。 */
  function openTaskFromJob(taskId: string) {
    dashboard.setSelectedTaskId(taskId);
    setActiveSection("tasks");
  }

  /** 业务说明：从全局运行队列跳回参照管理，方便继续查看标定行内状态。 */
  function openReferenceCenter() {
    setActiveSection("references");
  }

  /** 业务说明：保存任务后返回任务列表，符合后台创建或编辑后的常见操作路径。 */
  async function saveAndReturnToList(...args: Parameters<typeof dashboard.saveTask>) {
    await dashboard.saveTask(...args);
    setActiveSection("tasks");
  }

  return (
    <AdminShell
      activeSection={activeSection}
      selectedTaskName={dashboard.selectedTask?.name ?? null}
      onSectionChange={setActiveSection}
    >
      <AdminPageHeader
        eyebrow={getSectionEyebrow(activeSection)}
        title={getSectionTitle(activeSection)}
        isLoading={dashboard.isLoading}
        onRefresh={dashboard.refreshTasks}
        onLogout={onLogout}
      />

      {dashboard.notice ? (
        <OperationNoticePanel notice={dashboard.notice} onDismiss={() => dashboard.setNotice(null)} />
      ) : dashboard.error ? (
        <div
          className="mt-5 rounded-md border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100"
          role="alert"
        >
          {dashboard.error}
        </div>
      ) : null}

      <ActiveRunJobsPanel
        jobs={dashboard.activeRunJobs}
        tasks={dashboard.tasks}
        references={dashboard.references}
        onOpenTask={openTaskFromJob}
        onOpenReferences={openReferenceCenter}
      />

      <div className="mt-5">
        {activeSection === "tasks" ? (
          <TaskListSection
            dashboard={dashboard}
            onAdd={() => setActiveSection("add")}
            onEdit={openEdit}
            onHistory={openHistory}
          />
        ) : null}

        {activeSection === "references" ? <ReferenceSection dashboard={dashboard} /> : null}

        {activeSection === "add" ? (
          <TaskForm task={null} references={dashboard.references} onSubmit={saveAndReturnToList} />
        ) : null}

        {activeSection === "edit" ? (
          <TaskForm
            task={dashboard.selectedTask}
            references={dashboard.references}
            onSubmit={saveAndReturnToList}
          />
        ) : null}

        {activeSection === "history" ? (
          <TaskHistorySection dashboard={dashboard} onEdit={openEdit} />
        ) : null}
      </div>
    </AdminShell>
  );
}

type DashboardState = ReturnType<typeof useAdminDashboard>;

interface TaskListSectionProps {
  dashboard: DashboardState;
  onAdd: () => void;
  onEdit: (taskId: string) => void;
  onHistory: (taskId: string) => void;
}

interface ReferenceSectionProps {
  dashboard: DashboardState;
}

/** 业务说明：渲染参照管理页，用户先配置并运行参照，再创建监控任务。 */
function ReferenceSection({ dashboard }: ReferenceSectionProps) {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className={isCreating ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]" : "space-y-5"}>
      <div className="space-y-5">
        <section className="grid grid-cols-3 gap-3 sm:gap-4">
          <MetricCard compact title="参照数" value={String(dashboard.references.length)} tone="text-slate-100" />
          <MetricCard
            compact
            title="已标定"
            value={String(dashboard.references.filter((reference) => reference.latest_success_run_id).length)}
            tone="text-teal-200"
          />
          <MetricCard
            compact
            title="需处理"
            value={String(dashboard.references.filter((reference) => !reference.latest_success_run_id).length)}
            tone="text-amber-200"
          />
        </section>

        <AdminPanel
          title="参照列表"
          description="只有成功标定的参照才能作为任务基准；失败时请检查模型、密钥或 Prompt 后重试。"
          action={
            <Button variant={isCreating ? "secondary" : "primary"} onClick={() => setIsCreating((value) => !value)}>
              {isCreating ? <X className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
              {isCreating ? "收起表单" : "新增参照"}
            </Button>
          }
        >
          <ReferenceList
            references={dashboard.references}
            runJobByTarget={dashboard.runJobByTarget}
            deletingIds={dashboard.deletingIds}
            onRun={dashboard.runReferenceNow}
            onDelete={dashboard.removeReference}
          />
        </AdminPanel>
      </div>

      {isCreating ? (
        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="xl:sticky xl:top-5 xl:self-start"
        >
          <ReferenceForm compact onSubmit={dashboard.saveReference} />
        </motion.aside>
      ) : null}
    </div>
  );
}

/** 业务说明：渲染后台任务列表页，集中完成任务选择、运行、编辑和删除操作。 */
function TaskListSection({ dashboard, onAdd, onEdit, onHistory }: TaskListSectionProps) {
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
          title="当前平滑分"
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

interface TaskHistorySectionProps {
  dashboard: DashboardState;
  onEdit: (taskId: string) => void;
}

/** 业务说明：渲染后台任务历史页，围绕选中任务展示曲线、分布和运行记录。 */
function TaskHistorySection({ dashboard, onEdit }: TaskHistorySectionProps) {
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
          <div className="max-h-[560px] overflow-auto pr-1">
            <RunHistory
              runs={dashboard.runs}
              onSelectRun={dashboard.chooseRun}
            />
          </div>
        </AdminPanel>
      </section>
    </div>
  );
}

/** 业务说明：根据当前后台入口返回顶部小标题，帮助用户确认所在模块。 */
function getSectionEyebrow(section: AdminSection) {
  if (section === "references") return "Reference Center";
  if (section === "add") return "Task Create";
  if (section === "history") return "Run History";
  if (section === "edit") return "Task Settings";
  return "Task Center";
}

/** 业务说明：根据当前后台入口返回主标题，让任务列表、添加和历史模块层级明确。 */
function getSectionTitle(section: AdminSection) {
  if (section === "references") return "参照管理";
  if (section === "add") return "添加任务";
  if (section === "history") return "任务历史";
  if (section === "edit") return "编辑任务";
  return "任务列表";
}
