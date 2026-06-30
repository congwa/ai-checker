/** 业务说明：管理端按钮组件，基于 shadcn Button 模式统一后台所有可点击操作的反馈和可访问状态。 */
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 lg:h-10",
  {
    variants: {
      variant: {
        default: "bg-teal-400 text-slate-950 shadow-[0_0_0_1px_rgba(45,212,191,.25)] hover:bg-teal-300",
        primary: "bg-teal-400 text-slate-950 shadow-[0_0_0_1px_rgba(45,212,191,.25)] hover:bg-teal-300",
        secondary: "border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700",
        destructive: "bg-rose-500 text-white hover:bg-rose-400",
        danger: "bg-rose-500 text-white hover:bg-rose-400",
        outline: "border border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800",
        ghost: "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-50",
        link: "h-auto px-0 text-teal-200 underline-offset-4 hover:underline lg:h-auto",
      },
      size: {
        default: "h-11 px-4 lg:h-10",
        sm: "h-9 px-3 text-xs",
        icon: "h-11 w-11 px-0 lg:h-8 lg:w-8",
        compact: "h-11 px-3 lg:h-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/** 业务说明：渲染可复用操作按钮，统一后台动作的尺寸、变体和键盘焦点反馈以降低误操作风险。 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
    );
  },
);

Button.displayName = "Button";

export { buttonVariants };
