import fs from "node:fs/promises";
import path from "node:path";
import mime from "mime";
import { deploymentConfig } from "./config.js";
import { ensureContainer, remoteMetaPath, remoteVersionPrefix, writeJsonBlob } from "./storage.js";
import type { RemoteVersion } from "./types.js";

export type PublishRemoteInput = {
  remoteId: string;
  version: string;
  branch: string;
  sha: string;
  distPath: string;
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
