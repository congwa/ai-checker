/** 业务说明：管理端工作台 Hook，集中编排任务、运行历史、详情和操作反馈状态。 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createReferenceRunJob,
  createReference,
  createTaskRunJob,
  createTask,
  deleteReference,
  deleteTask,
  fetchActiveRunJobs,
  fetchReferences,
  fetchRunJob,
  fetchRunDetail,
  fetchRuns,
  fetchTasks,
  updateReference,
  updateTask,
} from "@/lib/api";
import type {
  ReferencePayload,
  ReferenceView,
  RunDetail,
  RunJobKind,
  RunJobView,
  RunView,
  TaskPayload,
  TaskView,
} from "@/types/domain";

type NoticeTone = "success" | "error" | "info";

export interface OperationNotice {
  tone: NoticeTone;
  title: string;
  message: string;
}

/** 业务说明：判断后台运行 Job 是否已经结束，避免重复轮询已完成的操作。 */
function isTerminalJob(job: RunJobView) {
  return job.status === "success" || job.status === "failed";
}

/** 业务说明：生成 Job 的目标索引，方便参照和任务列表读取自己的行内状态。 */
function getJobTargetKey(kind: RunJobKind, targetId: string) {
  return `${kind}:${targetId}`;
}

/** 业务说明：封装后台工作台状态，避免页面组件直接处理 API 编排和错误恢复。 */
export function useAdminDashboard(token: string) {
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [references, setReferences] = useState<ReferenceView[]>([]);
  const [runs, setRuns] = useState<RunView[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);
  const [runJobs, setRunJobs] = useState<RunJobView[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState<OperationNotice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const reportedTerminalJobs = useRef<Set<string>>(new Set());

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  const referenceMap = useMemo(
    () => new Map(references.map((reference) => [reference.id, reference])),
    [references],
  );

  const runJobByTarget = useMemo(() => {
    const targetMap = new Map<string, RunJobView>();
    for (const job of runJobs) {
      const key = getJobTargetKey(job.kind, job.target_id);
      if (!targetMap.has(key)) targetMap.set(key, job);
    }
    return targetMap;
  }, [runJobs]);

  const activeRunJobs = useMemo(
    () => runJobs.filter((job) => !isTerminalJob(job)),
    [runJobs],
  );

  /** 业务说明：写入或更新 Job 状态，让列表行保持最新运行反馈。 */
  const upsertRunJob = useCallback((job: RunJobView) => {
    setRunJobs((currentJobs) => {
      const nextJobs = currentJobs.filter((currentJob) => currentJob.id !== job.id);
      return [job, ...nextJobs].slice(0, 20);
    });
  }, []);

  /** 业务说明：根据后台操作结果展示顶部提示，让用户知道刚才动作的结论。 */
  const showNotice = useCallback((nextNotice: OperationNotice) => {
    setNotice(nextNotice);
    const toastOptions = { description: nextNotice.message };
    if (nextNotice.tone === "success") {
      toast.success(nextNotice.title, toastOptions);
    } else if (nextNotice.tone === "error") {
      toast.error(nextNotice.title, toastOptions);
    } else {
      toast.info(nextNotice.title, toastOptions);
    }
    if (nextNotice.tone === "error") {
      setError(nextNotice.message);
    }
  }, []);

  /** 业务说明：刷新参照列表，让参照标定状态和任务基准可用性保持最新。 */
  const refreshReferences = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setReferences(await fetchReferences(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "参照刷新失败");
    }
  }, [token]);

  /** 业务说明：刷新任务列表，并在首次进入后台时自动选择一个可查看的任务。 */
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

  /** 业务说明：刷新当前任务的运行历史，并默认展开最新一次运行详情用于诊断。 */
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

  /** 业务说明：处理 Job 终态，刷新对应业务数据并给出成功或失败反馈。 */
  const handleTerminalJob = useCallback(
    async (job: RunJobView) => {
      if (!isTerminalJob(job) || reportedTerminalJobs.current.has(job.id)) return;
      reportedTerminalJobs.current.add(job.id);
      if (job.kind === "reference") {
        await refreshReferences();
      } else {
        await refreshTasks();
        if (selectedTaskId === job.target_id) await refreshRuns(job.target_id);
      }
      const targetName =
        job.kind === "reference"
          ? references.find((reference) => reference.id === job.target_id)?.name ?? "参照"
          : tasks.find((task) => task.id === job.target_id)?.name ?? "任务";
      if (job.status === "success") {
        showNotice({
          tone: "success",
          title: job.kind === "reference" ? "参照标定完成" : "任务运行完成",
          message: `${targetName} 已完成 ${job.success_count}/${job.progress_total} 次有效采样。`,
        });
        return;
      }
      showNotice({
        tone: "error",
        title: job.kind === "reference" ? "参照标定失败" : "任务运行失败",
        message: job.error_summary ?? job.message ?? `${targetName} 运行失败，请检查配置后重试。`,
      });
    },
    [references, refreshReferences, refreshRuns, refreshTasks, selectedTaskId, showNotice, tasks],
  );

  /** 业务说明：恢复仍在后台运行的 Job，让刷新页面后用户仍知道哪些操作在等待。 */
  const refreshActiveRunJobs = useCallback(async () => {
    if (!token) return;
    try {
      const activeJobs = await fetchActiveRunJobs(token);
      setRunJobs((currentJobs) => {
        const terminalJobs = currentJobs.filter((job) => isTerminalJob(job));
        return [...activeJobs, ...terminalJobs].slice(0, 20);
      });
    } catch (err) {
      showNotice({
        tone: "error",
        title: "运行状态读取失败",
        message: err instanceof Error ? err.message : "无法读取后台运行状态",
      });
    }
  }, [showNotice, token]);

  /** 业务说明：保存任务配置，创建和编辑共用同一入口并保留后端密钥续用规则。 */
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
        showNotice({
          tone: "success",
          title: taskId ? "任务已更新" : "任务已创建",
          message: `${saved.name} 的配置已经保存。`,
        });
      } catch (err) {
        showNotice({
          tone: "error",
          title: "任务保存失败",
          message: err instanceof Error ? err.message : "任务保存失败",
        });
        throw err;
      }
    },
    [refreshTasks, showNotice, token],
  );

  /** 业务说明：保存参照配置，成功后刷新列表提醒用户仍需运行标定才能作为基准。 */
  const saveReference = useCallback(
    async (payload: ReferencePayload, referenceId?: string) => {
      setError(null);
      const sanitizedPayload = { ...payload };
      if (referenceId && !sanitizedPayload.api_key) delete sanitizedPayload.api_key;
      try {
        const saved = await (referenceId
          ? updateReference(token, referenceId, sanitizedPayload)
          : createReference(token, sanitizedPayload));
        await refreshReferences();
        showNotice({
          tone: "success",
          title: referenceId ? "参照已更新" : "参照已保存",
          message: `${saved.name} 已保存。运行成功后可作为任务基准。`,
        });
      } catch (err) {
        showNotice({
          tone: "error",
          title: "参照保存失败",
          message: err instanceof Error ? err.message : "参照保存失败",
        });
        throw err;
      }
    },
    [refreshReferences, showNotice, token],
  );

  /** 业务说明：启动参照后台标定 Job，页面立即进入可轮询状态而不是阻塞等待。 */
  const runReferenceNow = useCallback(
    async (referenceId: string) => {
      setError(null);
      reportedTerminalJobs.current.delete(referenceId);
      try {
        const job = await createReferenceRunJob(token, referenceId);
        upsertRunJob(job);
        showNotice({
          tone: "info",
          title: "参照运行已接收",
          message: job.message ?? "后台已经开始处理参照标定。",
        });
        if (isTerminalJob(job)) await handleTerminalJob(job);
      } catch (err) {
        showNotice({
          tone: "error",
          title: "参照运行启动失败",
          message: err instanceof Error ? err.message : "参照运行失败",
        });
      }
    },
    [handleTerminalJob, showNotice, token, upsertRunJob],
  );

  /** 业务说明：删除参照配置，并用删除中状态防止管理员重复点击造成误解。 */
  const removeReference = useCallback(
    async (referenceId: string) => {
      setError(null);
      setDeletingIds((current) => new Set(current).add(referenceId));
      try {
        await deleteReference(token, referenceId);
        await refreshReferences();
        showNotice({
          tone: "success",
          title: "参照已删除",
          message: "参照配置已移除，历史标定记录仍可用于审计。",
        });
      } catch (err) {
        showNotice({
          tone: "error",
          title: "参照删除失败",
          message: err instanceof Error ? err.message : "参照删除失败",
        });
      } finally {
        setDeletingIds((current) => {
          const next = new Set(current);
          next.delete(referenceId);
          return next;
        });
      }
    },
    [refreshReferences, showNotice, token],
  );

  /** 业务说明：启动任务后台采样 Job，让任务列表可持续展示运行进度和结果。 */
  const runNow = useCallback(
    async (taskId: string) => {
      setError(null);
      reportedTerminalJobs.current.delete(taskId);
      try {
        const job = await createTaskRunJob(token, taskId);
        upsertRunJob(job);
        showNotice({
          tone: "info",
          title: "任务运行已接收",
          message: job.message ?? "后台已经开始处理任务采样。",
        });
        if (isTerminalJob(job)) await handleTerminalJob(job);
      } catch (err) {
        showNotice({
          tone: "error",
          title: "任务运行启动失败",
          message: err instanceof Error ? err.message : "任务运行失败",
        });
      }
    },
    [handleTerminalJob, showNotice, token, upsertRunJob],
  );

  /** 业务说明：删除任务配置，并同步公开看板依赖状态与当前选中任务。 */
  const removeTask = useCallback(
    async (taskId: string) => {
      setError(null);
      setDeletingIds((current) => new Set(current).add(taskId));
      try {
        await deleteTask(token, taskId);
        if (selectedTaskId === taskId) setSelectedTaskId(null);
        await refreshTasks();
        showNotice({
          tone: "success",
          title: "任务已删除",
          message: "任务配置已移除，公开看板不会再展示它。",
        });
      } catch (err) {
        showNotice({
          tone: "error",
          title: "任务删除失败",
          message: err instanceof Error ? err.message : "任务删除失败",
        });
      } finally {
        setDeletingIds((current) => {
          const next = new Set(current);
          next.delete(taskId);
          return next;
        });
      }
    },
    [refreshTasks, selectedTaskId, showNotice, token],
  );

  /** 业务说明：选择某次历史运行详情，用于查看分布图和失败诊断信息。 */
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
    void refreshActiveRunJobs();
  }, [refreshActiveRunJobs]);

  useEffect(() => {
    void refreshRuns(selectedTaskId);
  }, [refreshRuns, selectedTaskId]);

  useEffect(() => {
    if (activeRunJobs.length === 0 || !token) return undefined;
    const timer = window.setInterval(() => {
      for (const job of activeRunJobs) {
        void fetchRunJob(token, job.id)
          .then(async (nextJob) => {
            upsertRunJob(nextJob);
            if (isTerminalJob(nextJob)) await handleTerminalJob(nextJob);
          })
          .catch((err) => {
            showNotice({
              tone: "error",
              title: "运行状态刷新失败",
              message: err instanceof Error ? err.message : "无法刷新后台运行状态",
            });
          });
      }
    }, 1200);
    return () => window.clearInterval(timer);
  }, [activeRunJobs, handleTerminalJob, showNotice, token, upsertRunJob]);

  return {
    tasks,
    references,
    referenceMap,
    runJobs,
    activeRunJobs,
    runJobByTarget,
    runs,
    selectedTask,
    selectedTaskId,
    selectedRun,
    deletingIds,
    notice,
    error,
    isLoading,
    setNotice,
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
