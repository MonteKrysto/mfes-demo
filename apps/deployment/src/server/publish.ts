import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import mime from "mime";
import { deploymentConfig } from "./config.js";
import {
  backendMetaPath,
  backendSnapshotPath,
  contractArtifactPath,
  ensureContainer,
  releaseManifestPath,
  releaseVersionPrefix,
  remoteMetaPath,
  remoteVersionPrefix,
  writeJsonBlob
} from "./storage.js";
import type { BackendVersion, ContractVerification, RemoteRelease, RemoteVersion } from "./types.js";

export type PublishRemoteInput = {
  remoteId: string;
  version: string;
  branch: string;
  sha: string;
  distPath: string;
};

export type PublishReleaseInput = {
  remoteId: string;
  version: string;
  branch: string;
  sha: string;
  frontend: {
    version: string;
    remoteEntryPath: string;
    artifactPrefix: string;
  };
  contractPath: string;
  backend?: BackendVersion;
  backendSnapshot?: Record<string, unknown>;
  frontendChanged?: boolean;
  backendChanged?: boolean;
};

export async function publishRemote(input: PublishRemoteInput): Promise<RemoteVersion> {
  const remote = deploymentConfig.remotes.find((item) => item.id === input.remoteId);

  if (!remote) {
    throw new Error(`Unknown remote: ${input.remoteId}`);
  }

  const container = await ensureContainer();
  const artifactPrefix = remoteVersionPrefix(input.remoteId, input.version);
  const files = await listFiles(input.distPath);

  for (const filePath of files) {
    const relativePath = path.relative(input.distPath, filePath).split(path.sep).join("/");
    const blobPath = `${artifactPrefix}/${relativePath}`;
    const content = await fs.readFile(filePath);
    const contentType = mime.getType(filePath) || "application/octet-stream";

    await container.getBlockBlobClient(blobPath).uploadData(content, {
      blobHTTPHeaders: {
        blobContentType: contentType
      }
    });

    if (relativePath.startsWith("assets/") && path.extname(relativePath) === ".css") {
      await container.getBlockBlobClient(`${artifactPrefix}/${path.basename(relativePath)}`).uploadData(content, {
        blobHTTPHeaders: {
          blobContentType: contentType
        }
      });
    }
  }

  const meta: RemoteVersion = {
    remoteId: input.remoteId,
    version: input.version,
    branch: input.branch,
    sha: input.sha,
    createdAt: new Date().toISOString(),
    artifactPrefix,
    remoteEntryPath: `${artifactPrefix}/assets/remoteEntry.js`
  };

  await writeJsonBlob(remoteMetaPath(input.remoteId, input.version), meta);
  return meta;
}

export async function publishRelease(input: PublishReleaseInput): Promise<RemoteRelease> {
  const remote = deploymentConfig.remotes.find((item) => item.id === input.remoteId);

  if (!remote) {
    throw new Error(`Unknown remote: ${input.remoteId}`);
  }

  const contract = JSON.parse(await fs.readFile(input.contractPath, "utf8")) as {
    consumer: string;
    provider: string;
  };
  const contractPath = contractArtifactPath(input.remoteId, input.version);
  const contractContent = await fs.readFile(input.contractPath);
  const container = await ensureContainer();

  await container.getBlockBlobClient(contractPath).uploadData(contractContent, {
    blobHTTPHeaders: {
      blobContentType: "application/json; charset=utf-8"
    }
  });

  const snapshotPath = backendSnapshotPath(input.remoteId, input.version);

  if (!input.backend && !input.backendSnapshot) {
    throw new Error(`Backend snapshot is required for ${input.remoteId} release ${input.version}`);
  }

  if (input.backendSnapshot) {
    await writeJsonBlob(snapshotPath, input.backendSnapshot);
  }

  const backend: BackendVersion = input.backend
    ? {
        ...input.backend,
        changed: false
      }
    : {
        remoteId: input.remoteId,
        version: input.version,
        branch: input.branch,
        sha: input.sha,
        createdAt: new Date().toISOString(),
        image: process.env.BACKEND_IMAGE ?? `local.azurecr.io/${remote.packageName}-api:${input.version}`,
        imageDigest: process.env.BACKEND_IMAGE_DIGEST || fakeImageDigest(input.remoteId, input.version, input.backendSnapshot),
        changed: input.backendChanged ?? true,
        snapshotPath
      };

  const verification: ContractVerification = {
    remoteId: input.remoteId,
    version: input.version,
    contractPath,
    provider: contract.provider,
    consumer: contract.consumer,
    verified: true,
    verifiedAt: new Date().toISOString()
  };

  const release: RemoteRelease = {
    remoteId: input.remoteId,
    version: input.version,
    branch: input.branch,
    sha: input.sha,
    createdAt: new Date().toISOString(),
    releasePath: releaseManifestPath(input.remoteId, input.version),
    frontend: {
      changed: input.frontendChanged ?? true,
      runtimeContractVersion: 2,
      version: input.frontend.version,
      remoteEntryPath: input.frontend.remoteEntryPath,
      artifactPrefix: input.frontend.artifactPrefix
    },
    backend,
    contract: verification
  };

  await writeJsonBlob(backendMetaPath(input.remoteId, input.version), backend);
  await writeJsonBlob(releaseManifestPath(input.remoteId, input.version), release);
  return release;
}

function fakeImageDigest(remoteId: string, version: string, snapshot: Record<string, unknown> | undefined) {
  const content = JSON.stringify({ remoteId, version, snapshot });
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    })
  );

  return files.flat();
}
