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
      backgroundColor: "rgba(7, 16, 24, 0.94)",
      borderColor: "rgba(255,255,255,0.12)",
      textStyle: { color: "#e2e8f0" },
    },
    grid: { left: 42, right: 18, top: 24, bottom: 36 },
    xAxis: {
      type: "category",
      data: series.map((point) => point.label),
      axisLine: { lineStyle: { color: "rgba(125,211,252,0.3)" } },
      axisTick: { show: false },
      axisLabel: { color: "#93c5fd" },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(125,211,252,0.13)" } },
      axisLabel: { color: "#93c5fd" },
    },
    series: [
      {
        name: "相似度评分",
        type: "line",
        smooth: true,
        data: series.map((point) => point.score),
        symbolSize: 7,
        lineStyle: { width: 3, color: "#2dd4bf" },
        itemStyle: { color: "#2dd4bf" },
        areaStyle: { color: "#2dd4bf", opacity: 0.08 },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 320, width: "100%" }} />;
}
