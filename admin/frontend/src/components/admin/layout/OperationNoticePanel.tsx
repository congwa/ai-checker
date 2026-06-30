/** 业务说明：后台操作反馈组件，统一展示保存、运行、删除等动作的成功或失败结论。 */
import { X } from "lucide-react";
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
  const toneClass =
    notice.tone === "success"
      ? "border-teal-400/30 bg-teal-400/10 text-teal-100"
      : notice.tone === "error"
        ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
        : "border-sky-400/30 bg-sky-400/10 text-sky-100";

  return (
    <div
      className={`mt-5 flex items-start gap-3 rounded-md border p-3 text-sm ${toneClass}`}
      role={notice.tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <StatusIcon status={status} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{notice.title}</div>
        <div className="mt-1 text-slate-200/90">{notice.message}</div>
      </div>
      <button
        type="button"
        className="grid h-8 w-8 shrink-0 place-items-center rounded text-current opacity-70 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
        aria-label="关闭操作提示"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
