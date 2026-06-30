/** 业务说明：管理端开关组件，基于 shadcn Switch 模式表达调度启用、公开展示等二元业务设置。 */
import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/** 业务说明：渲染可访问开关，让用户清楚切换任务是否调度或是否公开展示。 */
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/10 bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f860] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[#b7f860] data-[state=checked]:bg-[#b7f860]",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-slate-50 shadow-lg transition-transform data-[state=checked]:translate-x-5 data-[state=checked]:bg-[#07100d] data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitive.Root>
));

Switch.displayName = SwitchPrimitive.Root.displayName;
