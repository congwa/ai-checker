/** 业务说明：管理端按钮组件，提供参照、任务和运行操作的一致交互样式。 */
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-teal-400 text-slate-950 hover:bg-teal-300 shadow-[0_0_0_1px_rgba(45,212,191,.25)]",
  secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700",
  danger: "bg-rose-500 text-white hover:bg-rose-400",
  ghost: "bg-transparent text-slate-300 hover:bg-slate-800",
};

/** 业务说明：渲染可复用操作按钮，统一禁用、hover 和 focus 状态以降低误操作风险。 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
