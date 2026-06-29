/** 业务说明：公开看板 Vite 配置，启用 React、Tailwind 和 @ 路径别名。 */
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
/** 业务说明：导出前台构建配置，使公开看板在开发和打包时使用一致入口。 */
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
