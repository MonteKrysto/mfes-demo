var _a;
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
var port = Number((_a = process.env.HOST_UI_PORT) !== null && _a !== void 0 ? _a : 5173);
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src")
        }
    },
    server: {
        port: port,
        strictPort: true
    },
    preview: {
        port: port,
        strictPort: true
    },
    build: {
        target: "esnext"
    }
});
