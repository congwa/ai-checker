/** 业务说明：公开分布组件，展示最新成功运行的脱敏采样概率分布和统计摘要。 */
import ReactECharts from "echarts-for-react";
import { toDistributionBuckets } from "@/lib/series";
import type { PublicRunDetail } from "@/types/domain";

interface DistributionPanelProps {
  detail: PublicRunDetail | null;
}

/** 业务说明：渲染公开分布柱状图，帮助观察者理解评分背后的采样模式。 */
export function DistributionPanel({ detail }: DistributionPanelProps) {
  if (!detail) {
    return <div className="p-8 text-sm text-slate-400">暂无分布</div>;
  }
  const buckets = toDistributionBuckets(detail.distribution);
  const option = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { left: 42, right: 18, top: 18, bottom: 64 },
    xAxis: {
      type: "category",
      data: buckets.map((bucket) => bucket.label),
      axisLabel: { color: "#93c5fd", hideOverlap: true, interval: 4, margin: 14, rotate: 35 },
      axisLine: { lineStyle: { color: "#1e3a5f" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#93c5fd" },
      splitLine: { lineStyle: { color: "#172554" } },
    },
    series: [
      {
        name: "频率",
        type: "bar",
        data: buckets.map((bucket) => bucket.value),
        itemStyle: { color: "#38bdf8", borderRadius: [3, 3, 0, 0] },
      },
    ],
  };
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <Stat label="均值" value={detail.stats.mean?.toFixed?.(2) ?? "--"} />
        <Stat label="标准差" value={detail.stats.std_dev?.toFixed?.(2) ?? "--"} />
        <Stat label="唯一值" value={String(detail.stats.unique ?? "--")} />
      </div>
      <ReactECharts option={option} style={{ height: 260, width: "100%" }} />
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
}

/** 业务说明：渲染分布统计小指标，补充柱状图无法直接呈现的采样特征。 */
function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-md border border-sky-900/60 bg-slate-900/70 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-sky-100">{value}</div>
    </div>
  );
}
