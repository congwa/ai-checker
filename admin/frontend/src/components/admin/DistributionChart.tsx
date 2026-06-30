/** 业务说明：管理端分布图组件，展示某次运行的 1-355 采样概率分布。 */
import ReactECharts from "echarts-for-react";

interface DistributionChartProps {
  distribution: number[];
}

/** 业务说明：把 355 维分布聚合成桶状图，便于后台快速识别异常采样偏斜。 */
export function DistributionChart({ distribution }: DistributionChartProps) {
  const bucketSize = 10;
  const bucketCount = Math.ceil(355 / bucketSize);
  const buckets = Array.from({ length: bucketCount }, (_, index) =>
    distribution.slice(index * bucketSize, (index + 1) * bucketSize).reduce((sum, value) => sum + value, 0),
  );
  const labels = Array.from({ length: bucketCount }, (_, index) => `${index * bucketSize + 1}-${Math.min((index + 1) * bucketSize, 355)}`);
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(7, 16, 24, 0.94)",
      borderColor: "rgba(255,255,255,0.12)",
      textStyle: { color: "#e2e8f0" },
    },
    grid: { left: 42, right: 18, top: 20, bottom: 64 },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { color: "#94a3b8", hideOverlap: true, interval: 4, margin: 14, rotate: 35 },
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.28)" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      axisLabel: { color: "#94a3b8" },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.12)" } },
    },
    series: [
      {
        name: "频率",
        type: "bar",
        data: buckets,
        barMaxWidth: 18,
        itemStyle: { color: "#38bdf8", borderRadius: [3, 3, 0, 0] },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 260, width: "100%" }} />;
}
