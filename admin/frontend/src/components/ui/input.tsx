/** 业务说明：管理端文本输入组件，基于 shadcn Input 模式统一任务配置字段的可读性和焦点状态。 */
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export { Label } from "@/components/ui/label";
export { Textarea } from "@/components/ui/textarea";

/** 业务说明：渲染文本、密码和数字输入框，服务 baseurl、模型名、频率等配置录入。 */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-white/[0.12] bg-black/25 px-3 py-2 text-sm text-slate-100 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition-colors placeholder:text-slate-500 focus-visible:border-[#b7f860]/70 focus-visible:ring-2 focus-visible:ring-[#b7f860]/20 disabled:cursor-not-allowed disabled:opacity-50 aria-readonly:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
