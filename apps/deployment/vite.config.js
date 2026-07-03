var _a;
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
var apiProxyTarget = (_a = process.env.DEPLOYMENT_API_PROXY_TARGET) !== null && _a !== void 0 ? _a : "http://localhost:5050";
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src")
        }
    },
    server: {
        port: 5176,
        strictPort: true,
        proxy: {
            "/api": apiProxyTarget,
            "/storage": apiProxyTarget
        }
    },
    build: {
        target: "esnext"
    }
});
