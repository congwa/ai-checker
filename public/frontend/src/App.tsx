/** 业务说明：公开看板主页面，整合公开任务卡片和相似度评分曲线。 */
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicMetrics } from "@/components/public/PublicMetrics";
import { ScoreTimeline } from "@/components/public/ScoreTimeline";
import { TaskCards } from "@/components/public/TaskCards";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { usePublicDashboard } from "@/hooks/use-public-dashboard";

/** 业务说明：渲染只读公开看板，面向无需登录的模型相似度观察场景。 */
export default function App() {
  const dashboard = usePublicDashboard();
  return (
    <main className="min-h-screen px-4 py-5 text-slate-100 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1380px] space-y-5">
        <PublicHeader isLoading={dashboard.isLoading} onRefresh={dashboard.refreshOverview} />

        {dashboard.error ? <div className="rounded-md border border-rose-300/[0.35] bg-rose-400/[0.12] p-3 text-sm text-rose-100">{dashboard.error}</div> : null}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <TaskCards tasks={dashboard.tasks} selectedTaskId={dashboard.selectedTaskId} onSelect={dashboard.setSelectedTaskId} />
          <PublicMetrics task={dashboard.selectedTask} />
        </section>

        <Card className="relative overflow-hidden p-0">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#6ba8ff] via-[#39e6c1] to-[#ffb84d]" />
          <div className="flex flex-col gap-3 border-b border-white/[0.12] p-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>相似度评分趋势</CardTitle>
            {dashboard.selectedTask ? <Badge tone={dashboard.selectedTask.enabled ? "warning" : "neutral"}>{dashboard.selectedTask.enabled ? "调度中" : "已停用"}</Badge> : null}
          </div>
          <div className="px-1 pb-2 pt-3 sm:px-4">
            <ScoreTimeline points={dashboard.points} />
          </div>
        </Card>
      </div>
    </main>
  );
}
