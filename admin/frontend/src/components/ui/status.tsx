/** 业务说明：管理端状态图标系统，统一运行、等待、成功、失败和停用等业务状态的视觉表达。 */
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, Clock3, Info, Loader2, MinusCircle, XCircle } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusKind = "queued" | "running" | "success" | "failed" | "pending" | "warning" | "info" | "disabled";

interface StatusConfig {
  label: string;
  tone: BadgeTone;
  icon: LucideIcon;
  spin?: boolean;
}

const statusConfig: Record<StatusKind, StatusConfig> = {
  queued: { label: "排队中", tone: "warning", icon: Clock3 },
  running: { label: "运行中", tone: "warning", icon: Loader2, spin: true },
  success: { label: "成功", tone: "success", icon: CheckCircle2 },
  failed: { label: "失败", tone: "danger", icon: XCircle },
  pending: { label: "待处理", tone: "neutral", icon: Clock3 },
  warning: { label: "需处理", tone: "warning", icon: AlertTriangle },
  info: { label: "提示", tone: "info", icon: Info },
  disabled: { label: "已停用", tone: "neutral", icon: MinusCircle },
};

/** 业务说明：读取统一状态配置，确保同一业务状态在所有后台页面使用相同图标和颜色。 */
export function getStatusConfig(status: StatusKind) {
  return statusConfig[status];
}

interface StatusIconProps {
  status: StatusKind;
  className?: string;
}

/** 业务说明：渲染单独状态图标，用于按钮或列表行中表达运行中、失败等即时状态。 */
export function StatusIcon({ status, className }: StatusIconProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  return (
    <Icon
      className={cn("h-4 w-4", config.spin ? "animate-spin" : "", className)}
      aria-hidden="true"
    />
  );
}

interface StatusBadgeProps {
  status: StatusKind;
  label?: string;
  className?: string;
}

/** 业务说明：渲染带图标的状态徽标，让用户扫读时不只依赖颜色判断业务结果。 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  return (
    <Badge tone={config.tone} className={className}>
      <StatusIcon status={status} className="mr-1 h-3.5 w-3.5" />
      {label ?? config.label}
    </Badge>
  );
}
