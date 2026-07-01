/** 业务说明：公开看板指标组件，集中展示选中任务的当前评分、状态和更新时间。 */
import { Card } from "@/components/ui/card";
import { cn, formatDateTime, formatScore } from "@/lib/utils";
import type { PublicTask, SeriesPoint } from "@/types/domain";

interface PublicMetricsProps {
  task: PublicTask | null;
  points: SeriesPoint[];
}

/** 业务说明：渲染公开看板关键指标组，让观察者在第一屏获得最新任务状态。 */
export function PublicMetrics({ task, points }: PublicMetricsProps) {
  const latestPoint = points.length > 0 ? points[points.length - 1] : null;
  const previousPoint = points.length > 1 ? points[points.length - 2] : null;
  const delta = latestPoint && previousPoint ? latestPoint.smooth_score - previousPoint.smooth_score : null;
  const sampleTotal = latestPoint ? latestPoint.success_count + latestPoint.failed_count : 0;
  const passRate = sampleTotal > 0 && latestPoint ? (latestPoint.success_count / sampleTotal) * 100 : null;

  return (
    <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
      <Metric
        title="当前评分"
        value={formatScore(task?.last_smooth_score)}
        detail="相似度公开分"
        tone="teal"
        featured
      />
      <Metric
        title="评分变化"
        value={delta === null ? "--" : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`}
        detail="较上一采样点"
        tone={delta !== null && delta < 0 ? "rose" : "amber"}
      />
      <Metric
        title="样本通过率"
        value={passRate === null ? "--" : `${passRate.toFixed(1)}%`}
        detail={sampleTotal > 0 && latestPoint ? `${latestPoint.success_count}/${sampleTotal} 成功` : "暂无样本"}
        tone="teal"
      />
      <Metric
        title="更新时间"
        value={formatCompactTime(task?.updated_at)}
        detail={formatDateTime(task?.updated_at)}
        tone="slate"
      />
    </section>
  );
}

/** 业务说明：把更新时间压缩成指标卡可读短文本，避免长日期撑开布局。 */
function formatCompactTime(timestamp: number | null | undefined) {
  if (!timestamp) return "--";
  return new Date(timestamp * 1000).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface MetricProps {
  title: string;
  value: string;
  detail: string;
  tone: "teal" | "amber" | "rose" | "slate";
  featured?: boolean;
}

/** 业务说明：渲染单个公开看板指标卡，保持数字变化时有轻量反馈但不干扰阅读。 */
function Metric({ title, value, detail, tone, featured = false }: MetricProps) {
  const toneClass = {
    teal: { line: "from-[#5eead4] to-[#14b8a6]", text: "text-[#ccfbf1]" },
    amber: { line: "from-[#fbbf24] to-[#f97316]", text: "text-[#fde68a]" },
    rose: { line: "from-[#fb7185] to-[#e11d48]", text: "text-[#ffe4e6]" },
    slate: { line: "from-[#94a3b8] to-[#64748b]", text: "text-[#e2e8f0]" },
  }[tone];

  return (
    <Card
      className={cn(
        "group relative min-h-32 overflow-hidden p-4 transition-[border-color,transform,background-color] duration-200 hover:-translate-y-px motion-reduce:hover:translate-y-0",
        featured ? "border-[#5eead4]/45 bg-[#07120f]/[0.92] shadow-[0_22px_70px_rgba(20,184,166,0.13)]" : "",
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-85", toneClass.line)} />
      <div className="absolute right-3 top-3 grid grid-cols-3 gap-1 opacity-35 transition-opacity duration-200 group-hover:opacity-60">
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} className="h-1 w-1 bg-[#7dd3c7]/70" />
        ))}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#80958e]">{title}</div>
      <div className={cn("mt-4 font-display text-3xl font-semibold leading-none tracking-normal", toneClass.text)}>
        {value}
      </div>
      <div className="mt-4 text-xs leading-5 text-[#91a49d]">{detail}</div>
    </Card>
  );
}
