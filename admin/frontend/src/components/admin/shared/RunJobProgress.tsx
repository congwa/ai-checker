/** 业务说明：后台共享运行进度组件，统一参照标定、任务采样和全局 Job 队列的等待反馈。 */
import { Progress } from "@/components/ui/progress";
import { getRunJobProgress } from "@/lib/run-jobs";
import type { RunJobView } from "@/types/domain";

interface RunJobProgressProps {
  job: RunJobView;
  ariaLabel: string;
  fallbackMessage: string;
}

/** 业务说明：渲染 Job 进度、成功失败计数和当前消息，让长时间运行时用户知道系统仍在推进。 */
export function RunJobProgress({ job, ariaLabel, fallbackMessage }: RunJobProgressProps) {
  const progress = getRunJobProgress(job);

  return (
    <div className="mt-2 space-y-2 text-xs text-slate-300">
      <div className="flex items-center justify-between gap-3">
        <span>{job.message ?? fallbackMessage}</span>
        <span className="text-slate-400">
          {job.success_count} 成功 / {job.failed_count} 失败
        </span>
      </div>
      <Progress value={progress.percent} aria-label={`${ariaLabel} ${progress.current}/${progress.total}`} />
    </div>
  );
}
