/** 业务说明：公开看板 React 入口，挂载脱敏评分展示应用。 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";

/** 业务说明：把前台看板渲染到页面根节点，服务公开只读展示场景。 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

