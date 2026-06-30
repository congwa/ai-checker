/** 业务说明：管理端领域类型，统一任务配置、运行历史和分布详情的数据契约。 */

export type ProviderName = "openai" | "anthropic";
export type RunStatus = "success" | "failed";
export type RunJobKind = "reference" | "task";
export type RunJobStatus = "queued" | "running" | "success" | "failed";

export interface TaskView {
  id: string;
  name: string;
  provider: ProviderName;
  base_url: string;
  model: string;
  reference_id: string | null;
  prompt: string;
  sample_count: number;
  interval_seconds: number;
  smoothing_level: number;
  enabled: boolean;
  public_enabled: boolean;
  baseline_run_id: string | null;
  last_run_id: string | null;
  last_smooth_score: number | null;
  next_run_at: number;
  created_at: number;
  updated_at: number;
}

export interface TaskPayload {
  name: string;
  provider: ProviderName;
  base_url: string;
  api_key?: string;
  model: string;
  reference_id: string;
  prompt?: string;
  sample_count?: number;
  interval_seconds: number;
  smoothing_level: number;
  enabled: boolean;
  public_enabled: boolean;
}

export interface RunView {
  id: string;
  task_id: string;
  status: RunStatus;
  started_at: number;
  completed_at: number;
  sample_count: number;
  success_count: number;
  failed_count: number;
  raw_similarity: number;
  display_score: number;
  smooth_score: number;
  baseline_run_id: string | null;
  error_summary: string | null;
  stats: Record<string, number>;
}

export interface RunDetail extends RunView {
  distribution: number[];
  numbers: number[];
}

export interface ReferenceView {
  id: string;
  name: string;
  provider: ProviderName;
  base_url: string;
  model: string;
  prompt: string;
  sample_count: number;
  latest_run_id: string | null;
  latest_success_run_id: string | null;
  latest_run_status: RunStatus | null;
  created_at: number;
  updated_at: number;
}

export interface ReferencePayload {
  name: string;
  provider: ProviderName;
  base_url: string;
  api_key?: string;
  model: string;
  prompt: string;
  sample_count: number;
}

export interface RunJobView {
  id: string;
  kind: RunJobKind;
  target_id: string;
  status: RunJobStatus;
  run_id: string | null;
  progress_current: number;
  progress_total: number;
  success_count: number;
  failed_count: number;
  message: string | null;
  error_summary: string | null;
  created_at: number;
  started_at: number | null;
  completed_at: number | null;
  updated_at: number;
}
