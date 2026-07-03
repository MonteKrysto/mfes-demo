import path from "node:path";
import federation from "@originjs/vite-plugin-federation";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), "");
    return {
        base: normalizeBasePath(env.VITE_APP_BASE_PATH),
        plugins: [
            react(),
            federation({
                name: "frodosFranks",
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
            port: 5174,
            strictPort: true
        },
        preview: {
            port: 5174,
            strictPort: true
        },
        build: {
            target: "esnext"
        }
    };
});
function normalizeBasePath(value) {
    var trimmed = value === null || value === void 0 ? void 0 : value.trim();
    if (!trimmed || trimmed === "/") {
        return "/";
    }
    if (trimmed === "." || trimmed === "./") {
        return "./";
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//")) {
        return trimmed.endsWith("/") ? trimmed : "".concat(trimmed, "/");
    }
    var withLeadingSlash = trimmed.startsWith("/") ? trimmed : "/".concat(trimmed);
    return withLeadingSlash.endsWith("/") ? withLeadingSlash : "".concat(withLeadingSlash, "/");
}
