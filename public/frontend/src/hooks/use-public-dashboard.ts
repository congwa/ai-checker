/** 业务说明：公开看板 Hook，集中管理公开任务、评分曲线和刷新状态。 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchOverview, fetchSeries } from "@/lib/api";
import type { PublicTask, SeriesPoint } from "@/types/domain";

/** 业务说明：封装公开看板数据流，确保页面组件只处理展示而不触碰 API 编排。 */
export function usePublicDashboard() {
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [points, setPoints] = useState<SeriesPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  const refreshOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const overview = await fetchOverview();
      setTasks(overview.tasks);
      setSelectedTaskId((current) => current ?? overview.tasks[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "公开概览读取失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSelectedTask = useCallback(async (taskId: string | null) => {
    if (!taskId) {
      setPoints([]);
      return;
    }
    try {
      const series = await fetchSeries(taskId);
      setPoints(series.points);
    } catch (err) {
      setError(err instanceof Error ? err.message : "公开曲线读取失败");
    }
  }, []);

  useEffect(() => {
    void refreshOverview();
  }, [refreshOverview]);

  useEffect(() => {
    void refreshSelectedTask(selectedTaskId);
  }, [refreshSelectedTask, selectedTaskId]);

  return {
    tasks,
    selectedTask,
    selectedTaskId,
    points,
    error,
    isLoading,
    setSelectedTaskId,
    refreshOverview,
  };
}
