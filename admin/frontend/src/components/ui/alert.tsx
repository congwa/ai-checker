/** 业务说明：管理端提示组件，基于 shadcn Alert 模式展示保存、运行、删除和登录错误。 */
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva("rounded-md border p-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]", {
  variants: {
    variant: {
      default: "border-[#6ba8ff]/[0.35] bg-[#6ba8ff]/[0.12] text-[#cfe1ff]",
      success: "border-[#39e6c1]/[0.35] bg-[#39e6c1]/[0.12] text-[#b7fff0]",
      destructive: "border-rose-300/[0.35] bg-rose-400/[0.12] text-rose-100",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

/** 业务说明：渲染操作提示容器，让用户理解刚才操作的结果和下一步处理方向。 */
function Alert({ className, variant, ...props }: AlertProps) {
  return <div className={cn(alertVariants({ variant }), className)} {...props} />;
}

/** 业务说明：渲染提示标题，突出操作结果或错误类型。 */
function AlertTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-semibold", className)} {...props} />;
}

/** 业务说明：渲染提示正文，承载错误原因、等待说明或恢复建议。 */
function AlertDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-slate-200/90", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
