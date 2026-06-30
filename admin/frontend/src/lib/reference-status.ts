/** 业务说明：参照状态工具，集中定义参照能否作为任务基准的展示语义。 */
import type { StatusKind } from "@/components/ui/status";
import type { ReferenceView, RunJobView } from "@/types/domain";
import { isActiveRunJob } from "@/lib/run-jobs";

export type ReferenceStatus = "running" | "calibrated" | "failed" | "pending";

/** 业务说明：根据参照记录和当前 Job 判断业务状态，避免失败标定被误当成可用基准。 */
export function getReferenceStatus(reference: ReferenceView, job: RunJobView | undefined): ReferenceStatus {
  if (isActiveRunJob(job)) return "running";
  if (job?.status === "failed" || reference.latest_run_status === "failed") return "failed";
  if (reference.latest_success_run_id) return "calibrated";
  return "pending";
}

/** 业务说明：把参照业务状态转换成用户能扫读的标签文案。 */
export function getReferenceStatusLabel(status: ReferenceStatus) {
  if (status === "running") return "运行中";
  if (status === "calibrated") return "已标定";
  if (status === "failed") return "运行失败";
  return "待运行";
}

/** 业务说明：把参照业务状态映射到统一状态图标，保证标定页和全局队列语义一致。 */
export function getReferenceStatusKind(status: ReferenceStatus): StatusKind {
  if (status === "running") return "running";
  if (status === "calibrated") return "success";
  if (status === "failed") return "failed";
  return "pending";
}
