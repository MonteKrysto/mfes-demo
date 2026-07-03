import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { deploymentConfig } from "./config.js";
import { publishRelease, publishRemote } from "./publish.js";
import { getLatestRemoteRelease, remoteVersionPrefix, storageUrl } from "./storage.js";

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
const sourceLabel = sha === "local" && branch === "local" ? "local-dev" : `${sanitize(branch)}-${sanitize(sha)}`;
const version = process.env.BUILD_VERSION ?? `${timestamp}-${sourceLabel}`;
const root = path.resolve(new URL("../../../../", import.meta.url).pathname);
const frontendChanged = !process.argv.includes("--frontend-current");
const backendChanged = !process.argv.includes("--backend-current");
const latestRelease = await getLatestRemoteRelease(remote.id);

console.log(`Building release bundle for ${remote.displayName} as ${version}`);
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

const frontend = frontendChanged
  ? await buildAndPublishFrontend()
  : latestRelease?.frontend;

if (!frontend) {
  console.error(`No existing frontend artifact found for ${remote.displayName}; rerun without --frontend-current first.`);
  process.exit(1);
}

const backend = backendChanged ? undefined : latestRelease?.backend;

if (!backendChanged && !backend) {
  console.error(`No existing backend snapshot found for ${remote.displayName}; rerun without --backend-current first.`);
  process.exit(1);
}

const release = await publishRelease({
  remoteId: remote.id,
  version,
  branch,
  sha,
  frontend,
  backend,
  backendSnapshot: backendChanged ? await loadBackendSnapshot() : undefined,
  frontendChanged,
  backendChanged,
  contractPath: path.join(root, "apps", remote.packageName, "src/contracts/frontend-backend.contract.json")
});

console.log(`Published ${remote.displayName} release ${release.version}`);
console.log(`Release manifest: ${release.releasePath}`);
console.log(`Remote entry: ${release.frontend.remoteEntryPath}`);
console.log(`Backend image: ${release.backend.image}`);
console.log(`Contract verified: ${release.contract.verified ? "yes" : "no"}`);

async function buildAndPublishFrontend() {
  const artifactPublicBaseUrl = storageUrl(remoteVersionPrefix(remote.id, version)).replace(/^https?:/, "");

  execFileSync("pnpm", ["--filter", remote.packageName, "build"], {
    cwd: root,
    env: {
      ...process.env,
      VITE_APP_BASE_PATH: artifactPublicBaseUrl
    },
    stdio: "inherit"
  });

  return publishRemote({
    remoteId: remote.id,
    version,
    branch,
    sha,
    distPath: path.join(root, remote.localDistPath)
  });
}

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

async function loadBackendSnapshot() {
  const appModulePath = path.join(root, "apps", remote.packageName, "src/server/app.ts");
  const appModule = (await import(pathToFileURL(appModulePath).href)) as {
    providerResponses?: Record<string, unknown>;
  };

  if (!appModule.providerResponses) {
    throw new Error(`No providerResponses export found at ${appModulePath}`);
  }

  return appModule.providerResponses;
}
