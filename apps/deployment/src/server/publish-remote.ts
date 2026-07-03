import { execFileSync } from "node:child_process";
import path from "node:path";
import { deploymentConfig } from "./config.js";
import { publishRemote } from "./publish.js";
import { remoteVersionPrefix, storageUrl } from "./storage.js";

const remoteArg = process.argv[2];
const remote =
  deploymentConfig.remotes.find((item) => item.id === remoteArg || item.packageName === remoteArg) ??
  deploymentConfig.remotes[0];

if (!remoteArg || !remote) {
  console.error("Usage: pnpm --filter deployment publish:remote <remote-id|package-name>");
  process.exit(1);
}

const sha = process.env.BUILD_SHA ?? git(["rev-parse", "--short", "HEAD"]) ?? "local";
const branch = process.env.BUILD_BRANCH ?? git(["branch", "--show-current"]) ?? "local";
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const version = process.env.BUILD_VERSION ?? `${timestamp}-${sha}-${sanitize(branch)}`;
const root = path.resolve(new URL("../../../../", import.meta.url).pathname);

console.log(`Building ${remote.displayName} as ${version}`);
const artifactPublicBaseUrl = storageUrl(remoteVersionPrefix(remote.id, version)).replace(/^https?:/, "");
execFileSync("pnpm", ["--filter", remote.packageName, "lint"], {
  cwd: root,
  env: process.env,
  stdio: "inherit"
});
execFileSync("pnpm", ["--filter", remote.packageName, "test"], {
  cwd: root,
  env: process.env,
  stdio: "inherit"
});
execFileSync("pnpm", ["--filter", remote.packageName, "build"], {
  cwd: root,
  env: {
    ...process.env,
    VITE_APP_BASE_PATH: artifactPublicBaseUrl
  },
  stdio: "inherit"
});

const meta = await publishRemote({
  remoteId: remote.id,
  version,
  branch,
  sha,
  distPath: path.join(root, remote.localDistPath)
});

console.log(`Published ${remote.displayName} ${meta.version}`);
console.log(`Remote entry: ${meta.remoteEntryPath}`);

function git(args: string[]) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function sanitize(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "local";
}
