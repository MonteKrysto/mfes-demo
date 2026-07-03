import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const port = Number(process.env.HOST_UI_PORT ?? 5173);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port,
    strictPort: true
  },
  preview: {
    port,
    strictPort: true
  },
  build: {
    target: "esnext"
  }
});
