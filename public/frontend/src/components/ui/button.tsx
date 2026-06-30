/** 业务说明：公开看板按钮组件，基于 shadcn Button 模式统一刷新等只读操作的交互反馈。 */
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6ba8ff]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070a] disabled:pointer-events-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-[#9fc2ff]/[0.45] bg-[#6ba8ff] text-[#06101d] shadow-[0_14px_32px_rgba(107,168,255,0.2)] hover:bg-[#93c1ff]",
        secondary: "border border-white/[0.12] bg-white/[0.075] text-slate-100 hover:border-white/[0.2] hover:bg-white/[0.12]",
        ghost: "bg-transparent text-sky-100 hover:bg-sky-300/10 hover:text-sky-50",
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
