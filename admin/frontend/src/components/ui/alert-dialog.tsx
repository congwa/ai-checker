/** 业务说明：管理端确认弹窗组件，基于 shadcn AlertDialog 承载删除等不可逆操作确认。 */
import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;
const AlertDialogCancelPrimitive = AlertDialogPrimitive.Cancel;
const AlertDialogActionPrimitive = AlertDialogPrimitive.Action;

/** 业务说明：渲染确认弹窗遮罩，让危险操作打断当前流程并要求明确选择。 */
const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-[#050607]/85 backdrop-blur-sm", className)}
    {...props}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

/** 业务说明：渲染确认弹窗主体，集中说明删除影响并提供取消和继续操作。 */
const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-white/[0.12] bg-[linear-gradient(180deg,rgba(18,22,24,0.98),rgba(8,10,11,0.98))] p-5 text-slate-100 shadow-[0_28px_100px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.055)]",
        className,
      )}
      {...props}
    />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

/** 业务说明：渲染确认弹窗头部，让危险操作的业务对象和后果先被读取。 */
function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 text-left", className)} {...props} />;
}

/** 业务说明：渲染确认弹窗底部动作，保证取消和确认在移动端也有清晰触达区域。 */
function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

/** 业务说明：渲染确认弹窗标题，明确当前即将执行的危险业务动作。 */
const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("font-display text-base font-semibold text-slate-50", className)}
    {...props}
  />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

/** 业务说明：渲染确认弹窗说明，解释删除后对任务、参照或公开看板的业务影响。 */
const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-6 text-slate-400", className)}
    {...props}
  />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

/** 业务说明：渲染确认按钮，用于用户确认继续执行删除等高风险动作。 */
const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogActionPrimitive>,
  React.ComponentPropsWithoutRef<typeof AlertDialogActionPrimitive>
>(({ className, ...props }, ref) => (
  <AlertDialogActionPrimitive
    ref={ref}
    className={cn(buttonVariants({ variant: "danger" }), className)}
    {...props}
  />
));
AlertDialogAction.displayName = AlertDialogActionPrimitive.displayName;

/** 业务说明：渲染取消按钮，让用户可以安全退出危险操作确认流程。 */
const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogCancelPrimitive>,
  React.ComponentPropsWithoutRef<typeof AlertDialogCancelPrimitive>
>(({ className, ...props }, ref) => (
  <AlertDialogCancelPrimitive
    ref={ref}
    className={cn(buttonVariants({ variant: "secondary" }), className)}
    {...props}
  />
));
AlertDialogCancel.displayName = AlertDialogCancelPrimitive.displayName;

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
