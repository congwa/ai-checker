/** 业务说明：公开看板主页面，整合公开任务卡片、评分曲线和最新采样分布。 */
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { DistributionPanel } from "@/components/public/DistributionPanel";
import { ScoreTimeline } from "@/components/public/ScoreTimeline";
import { TaskCards } from "@/components/public/TaskCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatScore } from "@/lib/utils";
import { usePublicDashboard } from "@/hooks/use-public-dashboard";

/** 业务说明：渲染只读公开看板，面向无需登录的模型相似度观察场景。 */
export default function App() {
  const dashboard = usePublicDashboard();
  return (
    <main className="min-h-screen px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 rounded-lg border border-sky-900/60 bg-slate-950/75 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-sky-200">
              <img
                className="h-8 w-8 rounded-md object-contain shadow-[0_0_0_1px_rgba(56,189,248,.22)]"
                src="/codexbuy-logo.png"
                alt=""
                aria-hidden="true"
              />
              AI Checker Public
            </div>
          </div>
          <Button disabled={dashboard.isLoading} aria-busy={dashboard.isLoading} onClick={dashboard.refreshOverview}>
            <RefreshCw className="h-4 w-4" />
            {dashboard.isLoading ? "刷新中" : "刷新"}
          </Button>
        </motion.header>

        {dashboard.error ? <div className="rounded-md border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">{dashboard.error}</div> : null}

        <TaskCards tasks={dashboard.tasks} selectedTaskId={dashboard.selectedTaskId} onSelect={dashboard.setSelectedTaskId} />

        <section className="grid gap-5 md:grid-cols-3">
          <Metric title="当前平滑分" value={formatScore(dashboard.selectedTask?.last_smooth_score)} tone="text-teal-200" />
          <Metric title="最新状态" value={dashboard.selectedTask?.latest_status === "success" ? "成功" : dashboard.selectedTask?.latest_status === "failed" ? "失败" : "待运行"} tone="text-sky-100" />
          <Metric title="更新时间" value={formatDateTime(dashboard.selectedTask?.updated_at)} tone="text-slate-100" />
        </section>

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

interface MetricProps {
  title: string;
  value: string;
  tone: string;
}

/** 业务说明：渲染公开看板关键指标，让观察者在第一屏获得最新状态。 */
function Metric({ title, value, tone }: MetricProps) {
  return (
    <Card className="min-h-28">
      <div className="text-xs font-semibold uppercase text-slate-500">{title}</div>
      <motion.div key={value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 break-words text-2xl font-bold ${tone}`}>
        {value}
      </motion.div>
    </Card>
  );
}
