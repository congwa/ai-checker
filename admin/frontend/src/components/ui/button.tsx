/** 业务说明：管理端按钮组件，基于 shadcn Button 模式统一后台所有可点击操作的反馈和可访问状态。 */
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f860]/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030506] disabled:pointer-events-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:h-10",
  {
    variants: {
      variant: {
        default: "border border-[#e4ff8a]/[0.45] bg-[#b7f860] text-[#07100d] shadow-[0_12px_28px_rgba(183,248,96,0.16)] hover:bg-[#d7ff80]",
        primary: "border border-[#e4ff8a]/[0.45] bg-[#b7f860] text-[#07100d] shadow-[0_12px_28px_rgba(183,248,96,0.16)] hover:bg-[#d7ff80]",
        secondary: "border border-white/[0.12] bg-white/[0.07] text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] hover:border-white/[0.2] hover:bg-white/[0.11]",
        destructive: "border border-rose-300/30 bg-rose-500 text-white shadow-[0_14px_32px_rgba(244,63,94,0.22)] hover:bg-rose-400",
        danger: "border border-rose-300/30 bg-rose-500 text-white shadow-[0_14px_32px_rgba(244,63,94,0.22)] hover:bg-rose-400",
        outline: "border border-white/[0.14] bg-black/20 text-slate-100 hover:border-[#39e6c1]/[0.45] hover:bg-[#39e6c1]/10",
        ghost: "bg-transparent text-slate-300 hover:bg-white/[0.08] hover:text-slate-50",
        link: "h-auto px-0 text-[#39e6c1] underline-offset-4 hover:translate-y-0 hover:underline lg:h-auto",
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
