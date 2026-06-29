/** 业务说明：公开看板 API 客户端，统一读取脱敏任务、曲线和运行详情。 */
import type { OverviewResponse, PublicRunDetail, SeriesResponse } from "@/types/domain";

const API_BASE = import.meta.env.VITE_PUBLIC_API_BASE ?? "http://127.0.0.1:8020";

/** 业务说明：读取公开 API JSON 响应，并把失败状态转换为页面可展示错误。 */
async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "公开数据读取失败" }));
    throw new Error(payload.detail ?? "公开数据读取失败");
  }
  return response.json() as Promise<T>;
}

/** 业务说明：读取公开任务概览，驱动看板任务卡片和默认选中项。 */
export function fetchOverview() {
  return requestJson<OverviewResponse>("/api/overview");
}

/** 业务说明：读取指定公开任务曲线，供看板展示平滑评分趋势。 */
export function fetchSeries(taskId: string, rangeName = "24h") {
  return requestJson<SeriesResponse>(`/api/tasks/${taskId}/series?range=${rangeName}`);
}

/** 业务说明：读取公开运行分布详情，供看板展示最新采样分布。 */
export function fetchRunDetail(taskId: string, runId: string) {
  return requestJson<PublicRunDetail>(`/api/tasks/${taskId}/runs/${runId}`);
}

