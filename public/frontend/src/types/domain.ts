/** 业务说明：公开看板领域类型，定义脱敏任务、评分曲线和分布详情的数据契约。 */

export interface PublicTask {
  id: string;
  name: string;
  model: string;
  enabled: boolean;
  last_run_id: string | null;
  last_smooth_score: number | null;
  latest_status: string | null;
  updated_at: number;
}

export interface OverviewResponse {
  tasks: PublicTask[];
}

export interface SeriesPoint {
  run_id: string;
  completed_at: number;
  display_score: number;
  smooth_score: number;
  success_count: number;
  failed_count: number;
}

export interface SeriesResponse {
  task: PublicTask;
  points: SeriesPoint[];
}
