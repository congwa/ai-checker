/** 业务说明：管理端评分曲线组件，分别展示真实结果或前台相似度评分趋势。 */
import ReactECharts from "echarts-for-react";
import type { RunView } from "@/types/domain";
import { toScoreSeries } from "@/lib/score";

interface ScoreChartProps {
  runs: RunView[];
  variant: "actual" | "public";
}

const chartConfig = {
  actual: {
    name: "真实结果",
    color: "#ffb84d",
    getValue: (point: ReturnType<typeof toScoreSeries>[number]) => point.actualScore,
  },
  public: {
    name: "相似度评分",
    color: "#39e6c1",
    getValue: (point: ReturnType<typeof toScoreSeries>[number]) => point.publicScore,
  },
};

/** 业务说明：渲染评分趋势图，帮助后台区分单次真实结果和前台展示结果。 */
export function ScoreChart({ runs, variant }: ScoreChartProps) {
  const series = toScoreSeries(runs);
  const config = chartConfig[variant];
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(5, 6, 7, 0.95)",
      borderColor: "rgba(255,255,255,0.12)",
      textStyle: { color: "#e2e8f0" },
    },
    grid: { left: 42, right: 18, top: 24, bottom: 36 },
    xAxis: {
      type: "category",
      data: series.map((point) => point.label),
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.18)" } },
      axisTick: { show: false },
      axisLabel: { color: "#9aa4ae" },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.09)" } },
      axisLabel: { color: "#9aa4ae" },
    },
    series: [
      {
        name: config.name,
        type: "line",
        smooth: true,
        data: series.map(config.getValue),
        symbolSize: 7,
        lineStyle: { width: 3, color: config.color },
        itemStyle: { color: config.color },
        areaStyle: { color: config.color, opacity: 0.08 },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 280, width: "100%" }} />;
}
