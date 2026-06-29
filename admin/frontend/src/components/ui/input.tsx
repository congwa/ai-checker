/** 业务说明：管理端表单输入组件，统一任务配置字段的可读性和焦点状态。 */
import { forwardRef } from "react";
import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** 业务说明：渲染业务字段标签，确保后台配置项在紧凑布局中仍可识别。 */
export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs font-semibold uppercase tracking-wide text-slate-400", className)} {...props} />;
}

/** 业务说明：渲染文本/数字输入框，服务 baseurl、模型名、频率和平滑度等配置录入。 */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-teal-300 focus:ring-2 focus:ring-teal-300/20",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";

/** 业务说明：渲染下拉选择，服务 Provider 等有限选项配置。 */
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-300/20",
        className,
      )}
      {...props}
    />
  );
}

/** 业务说明：渲染多行输入，服务采样 prompt 等长文本业务配置。 */
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-teal-300 focus:ring-2 focus:ring-teal-300/20",
        className,
      )}
      {...props}
    />
  );
}

