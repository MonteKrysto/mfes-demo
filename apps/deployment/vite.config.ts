import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiProxyTarget = process.env.DEPLOYMENT_API_PROXY_TARGET ?? "http://localhost:5050";

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
