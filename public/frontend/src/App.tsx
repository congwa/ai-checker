/** 业务说明：公开看板主页面，整合公开任务卡片、评分曲线和最新采样分布。 */
import { DistributionPanel } from "@/components/public/DistributionPanel";
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
    <main className="min-h-screen px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <PublicHeader isLoading={dashboard.isLoading} onRefresh={dashboard.refreshOverview} />

        {dashboard.error ? <div className="rounded-md border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">{dashboard.error}</div> : null}

        <TaskCards tasks={dashboard.tasks} selectedTaskId={dashboard.selectedTaskId} onSelect={dashboard.setSelectedTaskId} />

        <PublicMetrics task={dashboard.selectedTask} />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>评分趋势</CardTitle>
              {dashboard.selectedTask ? <Badge tone={dashboard.selectedTask.enabled ? "warning" : "neutral"}>{dashboard.selectedTask.enabled ? "调度中" : "已停用"}</Badge> : null}
            </div>
            <ScoreTimeline points={dashboard.points} />
          </Card>
          <Card>
            <CardTitle>最新分布</CardTitle>
            <div className="mt-4">
              <DistributionPanel detail={dashboard.detail} />
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
