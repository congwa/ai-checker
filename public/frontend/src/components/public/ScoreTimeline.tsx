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
    color: ["#5eead4"],
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(3, 7, 6, 0.96)",
      borderColor: "rgba(94, 234, 212, 0.22)",
      borderWidth: 1,
      padding: 12,
      textStyle: { color: "#d9fff7", fontFamily: "IBM Plex Sans, Noto Sans SC, sans-serif" },
      axisPointer: { lineStyle: { color: "rgba(94,234,212,0.34)", type: "dashed" } },
    },
    grid: { left: 46, right: 22, top: 34, bottom: 42 },
    xAxis: {
      type: "category",
      data: series.map((point) => point.label),
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.14)" } },
      axisTick: { show: false },
      axisLabel: { color: "#81958e", margin: 14, hideOverlap: true },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.07)", type: "dashed" } },
      axisLabel: { color: "#81958e" },
    },
    graphic:
      series.length === 0
        ? {
            type: "text",
            left: "center",
            top: "middle",
            style: {
              text: "暂无曲线数据",
              fill: "#81958e",
              fontSize: 13,
              fontFamily: "IBM Plex Sans, Noto Sans SC, sans-serif",
            },
          }
        : [],
    series: [
      {
        name: "相似度评分",
        type: "line",
        smooth: true,
        data: series.map((point) => point.score),
        symbol: "circle",
        symbolSize: 7,
        lineStyle: { width: 2.6, color: "#5eead4", shadowBlur: 18, shadowColor: "rgba(94,234,212,0.32)" },
        itemStyle: { color: "#5eead4", borderColor: "#020403", borderWidth: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(94, 234, 212, 0.28)" },
              { offset: 0.62, color: "rgba(94, 234, 212, 0.08)" },
              { offset: 1, color: "rgba(94, 234, 212, 0)" },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "rgba(251,191,36,0.28)", type: "dashed", width: 1 },
          label: { color: "#fbbf24", formatter: "90", position: "insideEndTop" },
          data: [{ yAxis: 90 }],
        },
        emphasis: { focus: "series" },
      },
    ],
    animationDuration: 700,
    animationEasing: "cubicOut",
  };
  return <ReactECharts notMerge option={option} style={{ height: 390, width: "100%" }} />;
}
