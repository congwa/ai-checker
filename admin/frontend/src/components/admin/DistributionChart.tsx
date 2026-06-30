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
      backgroundColor: "rgba(5, 6, 7, 0.95)",
      borderColor: "rgba(255,255,255,0.12)",
      textStyle: { color: "#e2e8f0" },
    },
    grid: { left: 42, right: 18, top: 20, bottom: 64 },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { color: "#9aa4ae", hideOverlap: true, interval: 4, margin: 14, rotate: 35 },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.18)" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      axisLabel: { color: "#9aa4ae" },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.09)" } },
    },
    series: [
      {
        name: "频率",
        type: "bar",
        data: buckets,
        barMaxWidth: 18,
        itemStyle: { color: "#6ba8ff", borderRadius: [3, 3, 0, 0] },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 260, width: "100%" }} />;
}
