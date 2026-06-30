/** 业务说明：管理端 React 入口，挂载任务配置与运行监控工作台。 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/index.css";

/** 业务说明：把后台管理应用渲染到页面根节点，确保所有业务组件共享同一 React 树。 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={180}>
      <App />
    </TooltipProvider>
  </React.StrictMode>,
);
