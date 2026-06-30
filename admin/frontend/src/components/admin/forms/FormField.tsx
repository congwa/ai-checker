/** 业务说明：后台表单字段组件，统一任务和参照配置页的标签、控件间距和可读节奏。 */
import type { ReactNode } from "react";
import { Label } from "@/components/ui/input";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
}

/** 业务说明：渲染表单字段标签和控件容器，保证不同配置模块的录入路径一致。 */
export function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
