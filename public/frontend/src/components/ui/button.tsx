/** 业务说明：公开看板按钮组件，基于 shadcn Button 模式统一刷新等只读操作的交互反馈。 */
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020403] disabled:pointer-events-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  {
    variants: {
      variant: {
        default: "border border-[#5eead4]/[0.48] bg-[#5eead4] text-[#03100d] shadow-[0_12px_34px_rgba(45,212,191,0.18)] hover:bg-[#99f6e4]",
        secondary: "border border-white/[0.11] bg-white/[0.065] text-[#e6fff8] hover:border-[#5eead4]/[0.24] hover:bg-white/[0.1]",
        ghost: "bg-transparent text-[#ccfbf1] hover:bg-[#5eead4]/10 hover:text-[#f0fdfa]",
      },
      size: {
        default: "h-10 px-4",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/** 业务说明：渲染公开看板操作按钮，确保刷新等动作具备一致禁用和焦点状态。 */
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
