/** 业务说明：管理端滑块组件，基于 shadcn Slider 模式调整平滑度等连续业务参数。 */
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

/** 业务说明：渲染可键盘操作的滑块，让平滑度调整有清晰的触控区域和焦点反馈。 */
export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-black/[0.45] ring-1 ring-white/10">
      <SliderPrimitive.Range className="absolute h-full bg-[#b7f860]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border border-[#e4ff8a]/[0.55] bg-[#07100d] shadow-[0_0_0_4px_rgba(183,248,96,0.12)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7f860] disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));

Slider.displayName = SliderPrimitive.Root.displayName;
