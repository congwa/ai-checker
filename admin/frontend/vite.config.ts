/** 业务说明：管理端 Vite 配置，启用 React、Tailwind 和 @ 路径别名以支撑工作台开发。 */
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

/** 业务说明：导出构建配置，让本地开发、测试和生产打包共享同一入口规则。 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

