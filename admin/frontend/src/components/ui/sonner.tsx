/** 业务说明：管理端 Toast 组件，基于 Sonner 在操作完成或失败时给出轻量全局反馈。 */
import { Toaster as SonnerToaster } from "sonner";

/** 业务说明：渲染全局消息容器，让保存、运行和删除结果在页面任何位置都能被感知。 */
export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "border border-white/10 bg-[#0b121a] text-slate-100 shadow-[0_18px_60px_rgba(0,0,0,0.32)]",
          title: "text-slate-50",
          description: "text-slate-300",
        },
      }}
    />
  );
}
