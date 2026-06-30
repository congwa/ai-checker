/** 业务说明：后台工作台页面，整合任务配置、评分曲线、运行历史和分布诊断。 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  LogOut,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { DistributionChart } from "@/components/admin/DistributionChart";
import { MetricCard } from "@/components/admin/MetricCard";
import { ReferenceForm } from "@/components/admin/ReferenceForm";
import { ReferenceList } from "@/components/admin/ReferenceList";
import { RunHistory } from "@/components/admin/RunHistory";
import { ScoreChart } from "@/components/admin/ScoreChart";
import { TaskForm } from "@/components/admin/TaskForm";
import { TaskList } from "@/components/admin/TaskList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ADMIN_NAV_ITEMS, type AdminSection } from "@/lib/config/navigation";
import { formatScore } from "@/lib/score";
import { formatDateTime } from "@/lib/utils";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import type { OperationNotice } from "@/hooks/use-admin-dashboard";

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

  /** 业务说明：保存任务后返回任务列表，符合后台创建或编辑后的常见操作路径。 */
  async function saveAndReturnToList(...args: Parameters<typeof dashboard.saveTask>) {
    await dashboard.saveTask(...args);
    setActiveSection("tasks");
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-slate-800 bg-slate-950 px-4 py-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-teal-400/30 bg-teal-400/10 text-teal-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-teal-200">AI Checker</div>
              <div className="text-xs text-slate-500">Admin Console</div>
            </div>
          </div>
          <nav className="mt-6 grid gap-2">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeSection === item.id || (activeSection === "edit" && item.id === "tasks");
              return (
                <button
                  key={item.id}
                  className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-teal-300 text-slate-950"
                      : "text-slate-300 hover:bg-slate-900 hover:text-slate-50"
                  }`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-6 rounded-md border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-400">
            当前任务：{dashboard.selectedTask?.name ?? "未选择"}
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5 md:px-6 lg:px-8">
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between"
          >
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-200">
              {getSectionEyebrow(activeSection)}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-50 md:text-3xl">
              {getSectionTitle(activeSection)}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="success">已登录</Badge>
            <Button
              variant="secondary"
              onClick={dashboard.refreshTasks}
              disabled={dashboard.isLoading}
              aria-busy={dashboard.isLoading}
            >
              {dashboard.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {dashboard.isLoading ? "刷新中" : "刷新"}
            </Button>
            <Button variant="secondary" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              退出
            </Button>
          </div>
        </motion.header>

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
              <TaskForm
                task={null}
                references={dashboard.references}
                onSubmit={saveAndReturnToList}
              />
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
        </section>
      </div>
    </main>
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

interface OperationNoticePanelProps {
  notice: OperationNotice;
  onDismiss: () => void;
}

/** 业务说明：展示最近一次后台操作的结论，帮助管理员确认动作是否成功或如何恢复。 */
function OperationNoticePanel({ notice, onDismiss }: OperationNoticePanelProps) {
  const Icon =
    notice.tone === "success" ? CheckCircle2 : notice.tone === "error" ? AlertTriangle : Info;
  const toneClass =
    notice.tone === "success"
      ? "border-teal-400/30 bg-teal-400/10 text-teal-100"
      : notice.tone === "error"
        ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
        : "border-sky-400/30 bg-sky-400/10 text-sky-100";

  return (
    <div
      className={`mt-5 flex items-start gap-3 rounded-md border p-3 text-sm ${toneClass}`}
      role={notice.tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{notice.title}</div>
        <div className="mt-1 text-slate-200/90">{notice.message}</div>
      </div>
      <button
        type="button"
        className="rounded p-1 text-current opacity-70 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
        aria-label="关闭操作提示"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** 业务说明：渲染参照管理页，用户先配置并运行参照，再创建监控任务。 */
function ReferenceSection({ dashboard }: ReferenceSectionProps) {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-5">
      <section className="grid gap-5 md:grid-cols-3">
        <MetricCard title="参照数" value={String(dashboard.references.length)} tone="text-slate-100" />
        <MetricCard
          title="已标定"
          value={String(dashboard.references.filter((reference) => reference.latest_success_run_id).length)}
          tone="text-teal-200"
        />
        <MetricCard
          title="需处理"
          value={String(dashboard.references.filter((reference) => !reference.latest_success_run_id).length)}
          tone="text-amber-200"
        />
      </section>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>参照列表</CardTitle>
            <div className="mt-1 text-sm text-slate-400">
              只有成功标定的参照才能作为任务基准；失败时请检查模型、密钥或 Prompt 后重试。
            </div>
          </div>
          <Button variant={isCreating ? "secondary" : "primary"} onClick={() => setIsCreating((value) => !value)}>
            {isCreating ? <X className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
            {isCreating ? "收起表单" : "新增参照"}
          </Button>
        </div>
        <div className="mt-4">
          <ReferenceList
            references={dashboard.references}
            runJobByTarget={dashboard.runJobByTarget}
            deletingIds={dashboard.deletingIds}
            onRun={dashboard.runReferenceNow}
            onDelete={dashboard.removeReference}
          />
        </div>
      </Card>

      {isCreating ? <ReferenceForm onSubmit={dashboard.saveReference} /> : null}
    </div>
  );
}

/** 业务说明：渲染后台任务列表页，集中完成任务选择、运行、编辑和删除操作。 */
function TaskListSection({ dashboard, onAdd, onEdit, onHistory }: TaskListSectionProps) {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 md:grid-cols-3">
        <MetricCard title="任务数" value={String(dashboard.tasks.length)} tone="text-slate-100" />
        <MetricCard
          title="公开任务"
          value={String(dashboard.tasks.filter((task) => task.public_enabled).length)}
          tone="text-sky-200"
        />
        <MetricCard
          title="当前平滑分"
          value={formatScore(dashboard.selectedTask?.last_smooth_score)}
          tone="text-teal-200"
        />
      </section>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>任务列表</CardTitle>
          <Button onClick={onAdd}>添加任务</Button>
        </div>
        <div className="mt-4">
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
        </div>
      </Card>
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
      <Card>
        <CardTitle>任务历史</CardTitle>
        <div className="mt-4 text-sm text-slate-400">暂无可查看的任务</div>
      </Card>
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

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{dashboard.selectedTask.name}</CardTitle>
            <div className="mt-1 text-sm text-slate-400">{dashboard.selectedTask.model}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={dashboard.selectedTask.enabled ? "success" : "neutral"}>
              {dashboard.selectedTask.enabled ? "调度中" : "已停用"}
            </Badge>
            <Button variant="secondary" onClick={() => onEdit(dashboard.selectedTask!.id)}>
              编辑任务
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <ScoreChart runs={dashboard.runs} />
        </div>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardTitle>采样分布</CardTitle>
          {dashboard.selectedRun ? (
            <DistributionChart distribution={dashboard.selectedRun.distribution} />
          ) : (
            <div className="p-8 text-sm text-slate-400">暂无分布</div>
          )}
        </Card>
        <Card>
          <CardTitle>运行历史</CardTitle>
          <div className="mt-4 max-h-[560px] overflow-auto pr-1">
            <RunHistory
              runs={dashboard.runs}
              onSelectRun={dashboard.chooseRun}
            />
          </div>
        </Card>
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
