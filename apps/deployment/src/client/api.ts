export type RemoteDefinition = {
  id: string;
  packageName: string;
  displayName: string;
  localDistPath: string;
};

export type RemoteVersion = {
  remoteId: string;
  version: string;
  branch: string;
  sha: string;
  createdAt: string;
  artifactPrefix: string;
  remoteEntryPath: string;
};

export type RemoteRelease = {
  remoteId: string;
  version: string;
  branch: string;
  sha: string;
  createdAt: string;
  releasePath: string;
  frontend: {
    changed: boolean;
    version: string;
    remoteEntryPath: string;
    artifactPrefix: string;
  };
  backend: {
    remoteId: string;
    version: string;
    branch: string;
    sha: string;
    createdAt: string;
    image: string;
    changed: boolean;
    snapshotPath?: string;
  };
  contract: {
    remoteId: string;
    version: string;
    contractPath: string;
    provider: string;
    consumer: string;
    verified: boolean;
    verifiedAt: string;
  };
};

export type EnvironmentManifest = {
  environment: string;
  updatedAt: string;
  remotes: Record<
    string,
    {
      remoteId: string;
      version: string | null;
      releasePath?: string | null;
      remoteEntryPath: string | null;
      frontendVersion?: string | null;
      backendVersion?: string | null;
      contractVerified?: boolean | null;
      updatedAt: string | null;
    }
  >;
};

export type StorageContainer = {
  name: string;
  lastModified: string | null;
};

export type StorageDirectory = {
  name: string;
  path: string;
};

export type StorageBlob = {
  name: string;
  path: string;
  size: number;
  contentType: string | null;
  lastModified: string | null;
};

export type StorageListing = {
  container: string;
  prefix: string;
  directories: StorageDirectory[];
  blobs: StorageBlob[];
};

export async function getRemotes() {
  return request<{ remotes: RemoteDefinition[] }>("/api/remotes");
}

export async function getRemoteVersions(remoteId: string) {
  return request<{ versions: RemoteVersion[] }>(`/api/remotes/${remoteId}/versions`);
}

export async function getRemoteReleases(remoteId: string) {
  return request<{ releases: RemoteRelease[] }>(`/api/remotes/${remoteId}/releases`);
}

export async function getEnvironments() {
  return request<{ environments: EnvironmentManifest[] }>("/api/environments");
}

export async function getStorageContainers() {
  return request<{ configuredContainer: string; containers: StorageContainer[] }>("/api/storage/containers");
}

export async function getStorageListing(containerName: string, prefix = "") {
  const params = new URLSearchParams();

  if (prefix) {
    params.set("prefix", prefix);
  }

  const query = params.toString();
  return request<StorageListing>(`/api/storage/containers/${encodeURIComponent(containerName)}/blobs${query ? `?${query}` : ""}`);
}

export async function setupStorage() {
  return request<{ ok: true }>("/api/setup", { method: "POST" });
}

export async function setEnvironmentRemote(environment: string, remoteId: string, version: string) {
  return request<EnvironmentManifest>(`/api/environments/${environment}/remotes/${remoteId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ version })
  });
}

export async function promoteRemote(input: {
  remoteId: string;
  toEnvironment: string;
  fromEnvironment?: string;
  version?: string;
}) {
  return request<EnvironmentManifest>("/api/promote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error ?? response.statusText);
  }

  return response.json() as Promise<T>;
}
