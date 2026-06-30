/** 业务说明：后台工作台页面，整合任务配置、评分曲线、运行历史和分布诊断。 */
import { useState } from "react";
import { ActiveRunJobsPanel } from "@/components/admin/ActiveRunJobsPanel";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { OperationNoticePanel } from "@/components/admin/layout/OperationNoticePanel";
import { ReferenceSection } from "@/components/admin/sections/ReferenceSection";
import { TaskHistorySection } from "@/components/admin/sections/TaskHistorySection";
import { TaskListSection } from "@/components/admin/sections/TaskListSection";
import { TaskForm } from "@/components/admin/TaskForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAdminSectionEyebrow, getAdminSectionTitle, type AdminSection } from "@/lib/config/navigation";
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
        eyebrow={getAdminSectionEyebrow(activeSection)}
        title={getAdminSectionTitle(activeSection)}
        isLoading={dashboard.isLoading}
        onRefresh={dashboard.refreshTasks}
        onLogout={onLogout}
      />

      {dashboard.notice ? (
        <OperationNoticePanel notice={dashboard.notice} onDismiss={() => dashboard.setNotice(null)} />
      ) : dashboard.error ? (
        <Alert className="mt-5" variant="destructive" role="alert">
          <AlertDescription>{dashboard.error}</AlertDescription>
        </Alert>
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
