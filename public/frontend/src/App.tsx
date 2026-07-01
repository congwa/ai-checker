/** 业务说明：公开看板主页面，整合公开任务卡片和相似度评分曲线。 */
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { AlertTriangle, Activity } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicMetrics } from "@/components/public/PublicMetrics";
import { ScoreTimeline } from "@/components/public/ScoreTimeline";
import { SignalCanvas } from "@/components/public/SignalCanvas";
import { TaskCards } from "@/components/public/TaskCards";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { usePublicDashboard } from "@/hooks/use-public-dashboard";

/** 业务说明：渲染只读公开看板，面向无需登录的模型相似度观察场景。 */
export default function App() {
  const dashboard = usePublicDashboard();
  const shellRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      if (reduceMotion) {
        gsap.set(".gsap-reveal", { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        ".gsap-reveal",
        { opacity: 0.88, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.48,
          ease: "power3.out",
          stagger: 0.055,
        },
      );
      gsap.fromTo(".gsap-scan", { xPercent: -115 }, { xPercent: 125, duration: 2.8, ease: "none", repeat: -1, repeatDelay: 0.7 });
    }, shellRef);

    return () => context.revert();
  }, []);

  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !dashboard.selectedTaskId) return;
    const context = gsap.context(() => {
      gsap.fromTo(".gsap-selection", { opacity: 0.92, y: 6 }, { opacity: 1, y: 0, duration: 0.32, ease: "power2.out" });
    }, shellRef);
    return () => context.revert();
  }, [dashboard.selectedTaskId]);

  return (
    <main ref={shellRef} className="relative min-h-screen overflow-hidden bg-[#020403] px-4 py-4 text-slate-100 md:px-6 lg:px-8">
      <SignalCanvas />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full min-w-0 max-w-[1440px] flex-col gap-4">
        <PublicHeader
          isLoading={dashboard.isLoading}
          onRefresh={dashboard.refreshOverview}
          selectedTask={dashboard.selectedTask}
          taskCount={dashboard.tasks.length}
        />

        {dashboard.error ? (
          <div className="gsap-reveal flex items-center gap-3 rounded-lg border border-rose-300/[0.28] bg-rose-400/[0.1] px-4 py-3 text-sm font-medium text-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{dashboard.error}</span>
          </div>
        ) : null}

        <section className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="gsap-reveal min-w-0">
            <TaskCards tasks={dashboard.tasks} selectedTaskId={dashboard.selectedTaskId} onSelect={dashboard.setSelectedTaskId} />
          </aside>

          <section className="min-w-0 space-y-4 overflow-hidden">
            <div className="gsap-reveal gsap-selection">
              <PublicMetrics task={dashboard.selectedTask} points={dashboard.points} />
            </div>

            <Card className="gsap-reveal gsap-selection relative min-h-[420px] min-w-0 overflow-hidden p-0">
              <div className="gsap-scan pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(94,234,212,0.08),transparent)]" />
              <div className="flex flex-col gap-3 border-b border-white/[0.09] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7dd3c7]">
                    <Activity className="h-3.5 w-3.5" />
                    Telemetry
                  </div>
                  <CardTitle className="whitespace-nowrap">相似度评分趋势</CardTitle>
                  <CardDescription className="mt-1">最近 30 天公开脱敏分数，按完成时间排序</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{dashboard.points.length} 点</Badge>
                  {dashboard.selectedTask ? (
                    <Badge tone={dashboard.selectedTask.enabled ? "warning" : "neutral"}>
                      {dashboard.selectedTask.enabled ? "自动调度" : "已停用"}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="px-1 pb-2 pt-3 sm:px-4">
                <ScoreTimeline points={dashboard.points} />
              </div>
            </Card>
          </section>
        </section>
      </div>
    </main>
  );
}
