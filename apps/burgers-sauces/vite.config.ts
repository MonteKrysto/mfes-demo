import path from "node:path";
import federation from "@originjs/vite-plugin-federation";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: normalizeBasePath(env.VITE_APP_BASE_PATH),
    plugins: [
      react(),
      federation({
        name: "burgersSauces",
        filename: "remoteEntry.js",
        exposes: {
          "./RemoteApp": "./src/remote-entry.tsx"
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },
    server: {
      port: 5178,
      strictPort: true
    },
    preview: {
      port: 5178,
      strictPort: true
    },
    build: {
      target: "esnext"
    }
  };
});

function normalizeBasePath(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === "/") {
    return "/";
  }

  if (trimmed === "." || trimmed === "./") {
    return "./";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//")) {
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}
