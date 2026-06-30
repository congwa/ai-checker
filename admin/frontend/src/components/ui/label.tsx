/** 业务说明：管理端标签组件，基于 shadcn Label 语义让表单字段和控件保持正确关联。 */
import * as React from "react";
import { cn } from "@/lib/utils";

/** 业务说明：渲染业务字段标签，确保后台配置项在紧凑布局中仍可识别并可被辅助技术读取。 */
export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-xs font-semibold uppercase tracking-wide text-slate-400", className)}
    {...props}
  />
));

Label.displayName = "Label";
