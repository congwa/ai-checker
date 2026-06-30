/** 业务说明：管理端多行输入组件，基于 shadcn Textarea 模式服务 Prompt 等长文本业务配置。 */
import * as React from "react";
import { cn } from "@/lib/utils";

/** 业务说明：渲染多行输入，保证采样题目、错误说明等长文本在后台表单中可读可编辑。 */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-24 w-full rounded-md border border-white/[0.12] bg-black/25 px-3 py-2 text-sm text-slate-100 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition-colors placeholder:text-slate-500 focus-visible:border-[#b7f860]/70 focus-visible:ring-2 focus-visible:ring-[#b7f860]/20 disabled:cursor-not-allowed disabled:opacity-50 aria-readonly:cursor-not-allowed",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
