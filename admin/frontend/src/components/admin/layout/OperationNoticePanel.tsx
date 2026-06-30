/** 业务说明：后台操作反馈组件，统一展示保存、运行、删除等动作的成功或失败结论。 */
import { X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusIcon, type StatusKind } from "@/components/ui/status";
import type { OperationNotice } from "@/hooks/use-admin-dashboard";

interface OperationNoticePanelProps {
  notice: OperationNotice;
  onDismiss: () => void;
}

/** 业务说明：渲染可关闭的操作反馈，让管理员明确知道刚才动作是否完成以及下一步方向。 */
export function OperationNoticePanel({ notice, onDismiss }: OperationNoticePanelProps) {
  const status: StatusKind =
    notice.tone === "success" ? "success" : notice.tone === "error" ? "failed" : "info";
  const variant = notice.tone === "success" ? "success" : notice.tone === "error" ? "destructive" : "default";

  return (
    <Alert
      variant={variant}
      className="mt-5 flex items-start gap-3"
      role={notice.tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <StatusIcon status={status} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <AlertTitle>{notice.title}</AlertTitle>
        <AlertDescription>{notice.message}</AlertDescription>
      </div>
      <button
        type="button"
        className="grid h-8 w-8 shrink-0 place-items-center rounded text-current opacity-70 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
        aria-label="关闭操作提示"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}
