/** 业务说明：管理端工作台 Hook，集中编排任务、运行历史、详情和操作反馈状态。 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createReference,
  createTask,
  deleteReference,
  deleteTask,
  fetchReferences,
  fetchRunDetail,
  fetchRuns,
  fetchTasks,
  runReference,
  runTask,
  updateReference,
  updateTask,
} from "@/lib/api";
import type {
  ReferencePayload,
  ReferenceView,
  RunDetail,
  RunView,
  TaskPayload,
  TaskView,
} from "@/types/domain";

/** 业务说明：封装后台工作台状态，避免页面组件直接处理 API 编排和错误恢复。 */
export function useAdminDashboard(token: string) {
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [references, setReferences] = useState<ReferenceView[]>([]);
  const [runs, setRuns] = useState<RunView[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  const referenceMap = useMemo(
    () => new Map(references.map((reference) => [reference.id, reference])),
    [references],
  );

  const refreshReferences = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setReferences(await fetchReferences(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "参照刷新失败");
    }
  }, [token]);

  const refreshTasks = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const nextTasks = await fetchTasks(token);
      setTasks(nextTasks);
      setSelectedTaskId((current) => current ?? nextTasks[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "任务刷新失败");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const refreshRuns = useCallback(
    async (taskId: string | null) => {
      if (!token || !taskId) {
        setRuns([]);
        setSelectedRun(null);
        return;
      }
      try {
        const nextRuns = await fetchRuns(token, taskId);
        setRuns(nextRuns);
        if (nextRuns[0]) {
          const detail = await fetchRunDetail(token, taskId, nextRuns[0].id);
          setSelectedRun(detail);
        } else {
          setSelectedRun(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "运行历史刷新失败");
      }
    },
    [token],
  );

  const saveTask = useCallback(
    async (payload: TaskPayload, taskId?: string) => {
      setError(null);
      const sanitizedPayload = { ...payload };
      if (taskId && !sanitizedPayload.api_key) delete sanitizedPayload.api_key;
      try {
        const saved = taskId
          ? await updateTask(token, taskId, sanitizedPayload)
          : await createTask(token, sanitizedPayload);
        await refreshTasks();
        setSelectedTaskId(saved.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "任务保存失败");
        throw err;
      }
    },
    [refreshTasks, token],
  );

  const saveReference = useCallback(
    async (payload: ReferencePayload, referenceId?: string) => {
      setError(null);
      const sanitizedPayload = { ...payload };
      if (referenceId && !sanitizedPayload.api_key) delete sanitizedPayload.api_key;
      try {
        await (referenceId
          ? updateReference(token, referenceId, sanitizedPayload)
          : createReference(token, sanitizedPayload));
        await refreshReferences();
      } catch (err) {
        setError(err instanceof Error ? err.message : "参照保存失败");
        throw err;
      }
    },
    [refreshReferences, token],
  );

  const runReferenceNow = useCallback(
    async (referenceId: string) => {
      setBusyTaskId(referenceId);
      setError(null);
      try {
        await runReference(token, referenceId);
        await refreshReferences();
      } catch (err) {
        setError(err instanceof Error ? err.message : "参照运行失败");
      } finally {
        setBusyTaskId(null);
      }
    },
    [refreshReferences, token],
  );

  const removeReference = useCallback(
    async (referenceId: string) => {
      setError(null);
      try {
        await deleteReference(token, referenceId);
        await refreshReferences();
      } catch (err) {
        setError(err instanceof Error ? err.message : "参照删除失败");
      }
    },
    [refreshReferences, token],
  );

  const runNow = useCallback(
    async (taskId: string) => {
      setBusyTaskId(taskId);
      setError(null);
      try {
        await runTask(token, taskId);
        await refreshTasks();
        await refreshRuns(taskId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "任务运行失败");
      } finally {
        setBusyTaskId(null);
      }
    },
    [refreshRuns, refreshTasks, token],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      setError(null);
      try {
        await deleteTask(token, taskId);
        if (selectedTaskId === taskId) setSelectedTaskId(null);
        await refreshTasks();
      } catch (err) {
        setError(err instanceof Error ? err.message : "任务删除失败");
      }
    },
    [refreshTasks, selectedTaskId, token],
  );

  const chooseRun = useCallback(
    async (runId: string) => {
      if (!selectedTaskId) return;
      try {
        setSelectedRun(await fetchRunDetail(token, selectedTaskId, runId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "运行详情读取失败");
      }
    },
    [selectedTaskId, token],
  );

  useEffect(() => {
    void refreshTasks();
  }, [refreshTasks]);

  useEffect(() => {
    void refreshReferences();
  }, [refreshReferences]);

  useEffect(() => {
    void refreshRuns(selectedTaskId);
  }, [refreshRuns, selectedTaskId]);

  return {
    tasks,
    references,
    referenceMap,
    runs,
    selectedTask,
    selectedTaskId,
    selectedRun,
    busyTaskId,
    error,
    isLoading,
    setSelectedTaskId,
    refreshTasks,
    refreshReferences,
    saveReference,
    runReferenceNow,
    removeReference,
    saveTask,
    runNow,
    removeTask,
    chooseRun,
  };
}
