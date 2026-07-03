import { BlobServiceClient, type ContainerClient } from "@azure/storage-blob";
import { deploymentConfig } from "./config.js";
import type { EnvironmentManifest, HostManifest, RemoteVersion } from "./types.js";

export type StorageContainerSummary = {
  name: string;
  lastModified: string | null;
};

export type StorageDirectorySummary = {
  name: string;
  path: string;
};

export type StorageBlobSummary = {
  name: string;
  path: string;
  size: number;
  contentType: string | null;
  lastModified: string | null;
};

export function getBlobServiceClient() {
  return BlobServiceClient.fromConnectionString(deploymentConfig.storageConnectionString);
}

export function getContainerClient(containerName = deploymentConfig.containerName): ContainerClient {
  return getBlobServiceClient().getContainerClient(containerName);
}

export async function ensureContainer() {
  const container = getContainerClient();
  await container.createIfNotExists();
  return container;
}

export function remoteVersionPrefix(remoteId: string, version: string) {
  return `remotes/${remoteId}/versions/${version}`;
}

export function remoteMetaPath(remoteId: string, version: string) {
  return `${remoteVersionPrefix(remoteId, version)}/meta.json`;
}

export function environmentManifestPath(environment: string) {
  return `environments/${environment}/manifest.json`;
}

export function storageUrl(blobPath: string) {
  return `${deploymentConfig.publicBaseUrl}/storage/${blobPath}`;
}

export async function readJsonBlob<T>(blobPath: string): Promise<T | null> {
  const blob = (await ensureContainer()).getBlockBlobClient(blobPath);

  if (!(await blob.exists())) {
    return null;
  }

  const response = await blob.download();
  const text = await streamToString(response.readableStreamBody);
  return JSON.parse(text) as T;
}

export async function writeJsonBlob(blobPath: string, value: unknown) {
  const content = `${JSON.stringify(value, null, 2)}\n`;
  await getContainerClient()
    .getBlockBlobClient(blobPath)
    .upload(content, Buffer.byteLength(content), {
      blobHTTPHeaders: {
        blobContentType: "application/json; charset=utf-8"
      }
    });
}

export async function getEnvironmentManifest(environment: string): Promise<EnvironmentManifest> {
  const existing = await readJsonBlob<EnvironmentManifest>(environmentManifestPath(environment));

  if (existing) {
    return existing;
  }

  return {
    environment,
    updatedAt: new Date().toISOString(),
    remotes: Object.fromEntries(
      deploymentConfig.remotes.map((remote) => [
        remote.id,
        {
          remoteId: remote.id,
          version: null,
          remoteEntryPath: null,
          updatedAt: null
        }
      ])
    )
  };
}

export async function saveEnvironmentManifest(manifest: EnvironmentManifest) {
  await writeJsonBlob(environmentManifestPath(manifest.environment), {
    ...manifest,
    updatedAt: new Date().toISOString()
  });
}

export function toHostManifest(manifest: EnvironmentManifest): HostManifest {
  return {
    environment: manifest.environment,
    generatedAt: new Date().toISOString(),
    remotes: Object.fromEntries(
      Object.entries(manifest.remotes)
        .filter(([, remote]) => remote.version && remote.remoteEntryPath)
        .map(([remoteId, remote]) => [
          remoteId,
          {
            version: remote.version as string,
            remoteEntryUrl: storageUrl(remote.remoteEntryPath as string)
          }
        ])
    )
  };
}

export async function listRemoteVersions(remoteId: string): Promise<RemoteVersion[]> {
  const container = await ensureContainer();
  const prefix = `remotes/${remoteId}/versions/`;
  const versions: RemoteVersion[] = [];

  for await (const blob of container.listBlobsFlat({ prefix })) {
    if (!blob.name.endsWith("/meta.json")) {
      continue;
    }

    const meta = await readJsonBlob<RemoteVersion>(blob.name);

    if (meta) {
      versions.push(meta);
    }
  }

  return versions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLatestRemoteVersion(remoteId: string) {
  return (await listRemoteVersions(remoteId))[0] ?? null;
}

export async function listStorageContainers(): Promise<StorageContainerSummary[]> {
  await ensureContainer();

  const service = getBlobServiceClient();
  const containers: StorageContainerSummary[] = [];

  for await (const container of service.listContainers()) {
    containers.push({
      name: container.name,
      lastModified: container.properties.lastModified?.toISOString() ?? null
    });
  }

  return containers.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listStoragePath(containerName: string, prefix = "") {
  const normalizedPrefix = normalizePrefix(prefix);
  const container = getContainerClient(containerName);
  const directories = new Map<string, StorageDirectorySummary>();
  const blobs: StorageBlobSummary[] = [];

  for await (const blob of container.listBlobsFlat({ prefix: normalizedPrefix })) {
    const rest = blob.name.slice(normalizedPrefix.length);
    const separatorIndex = rest.indexOf("/");

    if (separatorIndex >= 0) {
      const directoryName = rest.slice(0, separatorIndex);
      const directoryPath = `${normalizedPrefix}${directoryName}/`;
      directories.set(directoryPath, {
        name: directoryName,
        path: directoryPath
      });
      continue;
    }

    blobs.push({
      name: rest || blob.name,
      path: blob.name,
      size: blob.properties.contentLength ?? 0,
      contentType: blob.properties.contentType ?? null,
      lastModified: blob.properties.lastModified?.toISOString() ?? null
    });
  }

  return {
    container: containerName,
    prefix: normalizedPrefix,
    directories: [...directories.values()].sort((a, b) => a.name.localeCompare(b.name)),
    blobs: blobs.sort((a, b) => a.name.localeCompare(b.name))
  };
}

function normalizePrefix(prefix: string) {
  const trimmed = prefix.trim().replace(/^\/+/, "");

  if (!trimmed) {
    return "";
  }

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

async function streamToString(stream: NodeJS.ReadableStream | undefined): Promise<string> {
  if (!stream) {
    return "";
  }

  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}
