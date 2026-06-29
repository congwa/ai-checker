/** 业务说明：管理端评分曲线组件，展示任务平滑分与即时展示分的历史变化。 */
import ReactECharts from "echarts-for-react";
import type { RunView } from "@/types/domain";
import { toScoreSeries } from "@/lib/score";

interface ScoreChartProps {
  runs: RunView[];
}

/** 业务说明：渲染评分趋势图，帮助后台判断平滑配置是否足够稳定。 */
export function ScoreChart({ runs }: ScoreChartProps) {
  const series = toScoreSeries(runs);
  const option = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { left: 42, right: 18, top: 24, bottom: 36 },
    xAxis: {
      type: "category",
      data: series.map((point) => point.label),
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: { color: "#94a3b8" },
    },
    yAxis: {
      type: "value",
      min: 90,
      max: 100,
      axisLine: { lineStyle: { color: "#334155" } },
      splitLine: { lineStyle: { color: "#1e293b" } },
      axisLabel: { color: "#94a3b8" },
    },
    series: [
      {
        name: "平滑分",
        type: "line",
        smooth: true,
        data: series.map((point) => point.smooth),
        symbolSize: 7,
        lineStyle: { width: 3, color: "#2dd4bf" },
        itemStyle: { color: "#2dd4bf" },
      },
      {
        name: "展示分",
        type: "line",
        smooth: true,
        data: series.map((point) => point.display),
        symbolSize: 5,
        lineStyle: { width: 2, color: "#f59e0b" },
        itemStyle: { color: "#f59e0b" },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 280, width: "100%" }} />;
}

