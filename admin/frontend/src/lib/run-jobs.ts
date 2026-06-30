/** 业务说明：后台运行 Job 工具，集中定义参照标定和任务采样的状态判断、索引和进度计算规则。 */
import type { RunJobKind, RunJobView } from "@/types/domain";

export interface RunJobProgressView {
  current: number;
  total: number;
  percent: number;
}

/** 业务说明：判断 Job 是否已经结束，避免已完成或失败的运行继续占用全局等待队列。 */
export function isTerminalRunJob(job: RunJobView) {
  return job.status === "success" || job.status === "failed";
}

/** 业务说明：判断 Job 是否仍需要用户等待，用于全局队列和行内运行态展示。 */
export function isActiveRunJob(job: RunJobView | undefined) {
  return job?.status === "queued" || job?.status === "running";
}

/** 业务说明：生成 Job 的目标索引，让任务和参照列表能从同一个状态集合读取自己的运行反馈。 */
export function getRunJobTargetKey(kind: RunJobKind, targetId: string) {
  return `${kind}:${targetId}`;
}

/** 业务说明：计算 Job 进度百分比，兼容刚排队时总数或当前数尚未稳定的状态。 */
export function getRunJobProgress(job: RunJobView): RunJobProgressView {
  const total = Math.max(job.progress_total, 1);
  const current = Math.min(Math.max(job.progress_current, 0), total);
  return {
    total,
    current,
    percent: Math.min(100, Math.round((current / total) * 100)),
  };
}
