export type RemoteVersion = {
  remoteId: string;
  version: string;
  branch: string;
  sha: string;
  createdAt: string;
  artifactPrefix: string;
  remoteEntryPath: string;
};

export type EnvironmentRemote = {
  remoteId: string;
  version: string | null;
  remoteEntryPath: string | null;
  updatedAt: string | null;
};

export type EnvironmentManifest = {
  environment: string;
  updatedAt: string;
  remotes: Record<string, EnvironmentRemote>;
};

export type HostManifest = {
  environment: string;
  generatedAt: string;
  remotes: Record<
    string,
    {
      version: string;
      remoteEntryUrl: string;
    }
  >;
};

