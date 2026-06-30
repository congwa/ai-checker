/** 业务说明：管理端 API 客户端，统一封装后台 Token、请求路径和错误解析。 */
import type {
  ReferencePayload,
  ReferenceView,
  RunDetail,
  RunJobView,
  RunPublicPayload,
  RunView,
  TaskPayload,
  TaskView,
} from "@/types/domain";

const API_BASE = import.meta.env.VITE_ADMIN_API_BASE ?? "http://127.0.0.1:8010";

/** 业务说明：构造后台请求头，确保所有管理操作都携带用户输入的 Bearer Token。 */
function buildHeaders(token: string, hasBody: boolean) {
  return {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
}

/** 业务说明：执行后台请求并提取错误文案，让页面展示一致的业务失败原因。 */
async function requestJson<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const hasBody = init.body !== undefined;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(token, hasBody),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(payload.detail ?? "请求失败");
  }
  return response.json() as Promise<T>;
}

/** 业务说明：读取后台全部任务，供工作台刷新任务列表和状态摘要。 */
export function fetchTasks(token: string) {
  return requestJson<TaskView[]>("/api/tasks", token);
}

/** 业务说明：读取全部参照配置，供添加任务时选择明确的比较基准。 */
export function fetchReferences(token: string) {
  return requestJson<ReferenceView[]>("/api/references", token);
}

/** 业务说明：创建独立参照配置，后续可单独运行生成基准分布。 */
export function createReference(token: string, payload: ReferencePayload) {
  return requestJson<ReferenceView>("/api/references", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** 业务说明：更新参照配置，支持替换参照 API 或调整采样数。 */
export function updateReference(
  token: string,
  referenceId: string,
  payload: Partial<ReferencePayload>,
) {
  return requestJson<ReferenceView>(`/api/references/${referenceId}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** 业务说明：删除不再使用的参照配置，避免任务创建时选错旧基准。 */
export function deleteReference(token: string, referenceId: string) {
  return requestJson<{ deleted: boolean }>(`/api/references/${referenceId}`, token, {
    method: "DELETE",
  });
}

/** 业务说明：单独运行参照标定，生成任务评分所需的最新基准分布。 */
export function runReference(token: string, referenceId: string) {
  return requestJson<RunView>(`/api/references/${referenceId}/run`, token, { method: "POST" });
}

/** 业务说明：创建参照后台标定 Job，让管理端可以立即显示等待与进度状态。 */
export function createReferenceRunJob(token: string, referenceId: string) {
  return requestJson<RunJobView>(`/api/references/${referenceId}/run-jobs`, token, {
    method: "POST",
  });
}

/** 业务说明：创建监控任务，提交后台用户录入的模型 API 与评分配置。 */
export function createTask(token: string, payload: TaskPayload) {
  return requestJson<TaskView>("/api/tasks", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** 业务说明：更新监控任务，支持用户调整频率、平滑度、公开开关或替换密钥。 */
export function updateTask(token: string, taskId: string, payload: Partial<TaskPayload>) {
  return requestJson<TaskView>(`/api/tasks/${taskId}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** 业务说明：删除不再需要监控的任务，并从公开看板移除。 */
export function deleteTask(token: string, taskId: string) {
  return requestJson<{ deleted: boolean }>(`/api/tasks/${taskId}`, token, { method: "DELETE" });
}

/** 业务说明：手动触发一次任务运行，用于立即验证模型状态并生成曲线点。 */
export function runTask(token: string, taskId: string) {
  return requestJson<RunView>(`/api/tasks/${taskId}/run`, token, { method: "POST" });
}

/** 业务说明：创建任务后台运行 Job，让管理端通过轮询展示采样进度和错误摘要。 */
export function createTaskRunJob(token: string, taskId: string) {
  return requestJson<RunJobView>(`/api/tasks/${taskId}/run-jobs`, token, { method: "POST" });
}

/** 业务说明：读取单个后台运行 Job，用于刷新行内进度和最终状态。 */
export function fetchRunJob(token: string, jobId: string) {
  return requestJson<RunJobView>(`/api/run-jobs/${jobId}`, token);
}

/** 业务说明：读取当前仍在执行的后台运行 Job，支持页面刷新后恢复等待反馈。 */
export function fetchActiveRunJobs(token: string) {
  return requestJson<RunJobView[]>("/api/run-jobs/active", token);
}

/** 业务说明：读取任务近期运行历史，支撑后台曲线、错误摘要和分布详情。 */
export function fetchRuns(token: string, taskId: string) {
  return requestJson<RunView[]>(`/api/tasks/${taskId}/runs`, token);
}

/** 业务说明：读取单次运行详情，支撑后台查看分布和原始采样。 */
export function fetchRunDetail(token: string, taskId: string, runId: string) {
  return requestJson<RunDetail>(`/api/tasks/${taskId}/runs/${runId}`, token);
}

/** 业务说明：删除某次任务历史记录，同步让后台曲线和公开看板移除该数据点。 */
export function deleteRun(token: string, taskId: string, runId: string) {
  return requestJson<{ deleted: boolean }>(`/api/tasks/${taskId}/runs/${runId}`, token, {
    method: "DELETE",
  });
}

/** 业务说明：更新单次运行的公开可见性或前台展示分，不影响真实评分与后台诊断。 */
export function updateRunPublicSettings(
  token: string,
  taskId: string,
  runId: string,
  payload: RunPublicPayload,
) {
  return requestJson<RunView>(`/api/tasks/${taskId}/runs/${runId}/public`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
