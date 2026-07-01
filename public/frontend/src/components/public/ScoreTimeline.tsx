/** 业务说明：公开评分曲线组件，展示公开任务相似度评分时间趋势。 */
import ReactECharts from "echarts-for-react";
import { toPublicScoreSeries } from "@/lib/series";
import type { SeriesPoint } from "@/types/domain";

interface ScoreTimelineProps {
  points: SeriesPoint[];
}

/** 业务说明：渲染公开趋势图，让观察者快速判断模型相似度是否稳定。 */
export function ScoreTimeline({ points }: ScoreTimelineProps) {
  const series = toPublicScoreSeries(points);
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(5, 7, 10, 0.95)",
      borderColor: "rgba(255,255,255,0.12)",
      textStyle: { color: "#e2e8f0" },
      axisPointer: { lineStyle: { color: "rgba(255,255,255,0.24)" } },
    },
    grid: { left: 42, right: 18, top: 24, bottom: 38 },
    xAxis: {
      type: "category",
      data: series.map((point) => point.label),
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.18)" } },
      axisTick: { show: false },
      axisLabel: { color: "#a7b3c3", margin: 14 },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)", type: "dashed" } },
      axisLabel: { color: "#a7b3c3" },
    },
    series: [
      {
        name: "相似度评分",
        type: "line",
        smooth: true,
        data: series.map((point) => point.score),
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 3, color: "#39e6c1" },
        itemStyle: { color: "#39e6c1", borderColor: "#05070a", borderWidth: 2 },
        areaStyle: { color: "rgba(57, 230, 193, 0.15)" },
        emphasis: { focus: "series" },
      },
    ],
    animationDuration: 450,
  };
  return <ReactECharts option={option} style={{ height: 320, width: "100%" }} />;
}
