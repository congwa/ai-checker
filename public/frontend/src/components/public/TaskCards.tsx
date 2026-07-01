/** 业务说明：公开任务卡片组件，展示每个公开任务的最新相似度评分和运行状态。 */
import { Activity, CheckCircle2, CircleDashed, ListFilter, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatScore, cn } from "@/lib/utils";
import type { PublicTask } from "@/types/domain";

interface TaskCardsProps {
  tasks: PublicTask[];
  selectedTaskId: string | null;
  onSelect: (taskId: string) => void;
}

/** 业务说明：渲染公开任务列表，点击任务后展示对应评分曲线。 */
export function TaskCards({ tasks, selectedTaskId, onSelect }: TaskCardsProps) {
  if (tasks.length === 0) {
    return (
      <Card className="min-h-[280px] w-full max-w-full border-dashed p-6">
        <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-[#91a49d]">暂无公开任务</div>
      </Card>
    );
  }
  return (
    <Card className="w-full max-w-full overflow-hidden p-0">
      <div className="border-b border-white/[0.09] px-4 py-3">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7dd3c7]">
          <ListFilter className="h-3.5 w-3.5" />
          Public Tasks
        </div>
        <CardTitle className="whitespace-nowrap">任务目录</CardTitle>
        <CardDescription className="mt-1">选择一个公开任务查看趋势</CardDescription>
      </div>
      <div className="grid max-h-[calc(100vh-220px)] w-full max-w-full auto-rows-max content-start gap-2 overflow-y-auto p-3">
      {tasks.map((task, index) => (
        <button
          key={task.id}
          onClick={() => onSelect(task.id)}
          aria-pressed={selectedTaskId === task.id}
          className={cn(
            "w-full max-w-full",
            "group relative overflow-hidden rounded-lg border p-3 text-left transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020403] motion-reduce:hover:translate-y-0",
            selectedTaskId === task.id
              ? "border-[#5eead4]/[0.46] bg-[#5eead4]/[0.09] shadow-[inset_3px_0_0_rgba(94,234,212,0.9),0_18px_54px_rgba(20,184,166,0.1)]"
              : "border-white/[0.09] bg-[#070b0a]/[0.78] hover:border-[#5eead4]/[0.26] hover:bg-white/[0.055]",
          )}
          style={{ transitionDelay: `${Math.min(index * 12, 90)}ms` }}
        >
          {selectedTaskId === task.id ? <span className="absolute inset-x-0 top-0 h-px bg-[#5eead4]" /> : null}
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_76px] items-start gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#f4fffb]">
                <StatusIcon status={task.latest_status} />
                <span className="truncate">{task.name}</span>
              </div>
              <div className="mt-1 truncate text-xs text-[#81958e]">{task.model}</div>
            </div>
            <div className="w-[76px] truncate rounded-md border border-[#5eead4]/25 bg-[#5eead4]/[0.09] px-2 py-1 text-right font-display text-xl font-semibold leading-none text-[#ccfbf1]">
              {formatScore(task.last_smooth_score)}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={task.latest_status === "success" ? "success" : task.latest_status === "failed" ? "danger" : "neutral"}>
              {task.latest_status === "success" ? "成功" : task.latest_status === "failed" ? "失败" : "待运行"}
            </Badge>
            <Badge tone={task.enabled ? "warning" : "neutral"}>{task.enabled ? "自动调度" : "已停用"}</Badge>
          </div>
          <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <div
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.075]"
              role="meter"
              aria-label="相似度评分"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={task.last_smooth_score ?? 0}
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  task.latest_status === "failed"
                    ? "bg-rose-300/70"
                    : task.latest_status === "success"
                      ? "bg-gradient-to-r from-[#5eead4] via-[#2dd4bf] to-[#fbbf24]"
                      : "bg-white/25",
                )}
                style={{ width: `${Math.max(8, Math.min(100, task.last_smooth_score ?? 0))}%` }}
              />
            </div>
            <div className="hidden max-w-[120px] truncate text-xs text-[#71857e] sm:block">{formatDateTime(task.updated_at)}</div>
          </div>
        </button>
      ))}
      </div>
    </Card>
  );
}

/** 业务说明：渲染任务运行状态图标，让色彩之外也有可辨识状态。 */
function StatusIcon({ status }: { status: string | null }) {
  if (status === "success") return <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5eead4]" />;
  if (status === "failed") return <XCircle className="h-4 w-4 shrink-0 text-rose-300" />;
  if (status) return <Activity className="h-4 w-4 shrink-0 text-[#fbbf24]" />;
  return <CircleDashed className="h-4 w-4 shrink-0 text-[#94a3b8]" />;
}
