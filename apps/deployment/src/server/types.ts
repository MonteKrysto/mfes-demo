export type RemoteVersion = {
  remoteId: string;
  version: string;
  branch: string;
  sha: string;
  createdAt: string;
  artifactPrefix: string;
  remoteEntryPath: string;
};

export type BackendVersion = {
  remoteId: string;
  version: string;
  branch: string;
  sha: string;
  createdAt: string;
  image: string;
  changed: boolean;
  snapshotPath?: string;
};

export type ContractVerification = {
  remoteId: string;
  version: string;
  contractPath: string;
  provider: string;
  consumer: string;
  verified: boolean;
  verifiedAt: string;
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
  backend: BackendVersion;
  contract: ContractVerification;
};

export type EnvironmentRemote = {
  remoteId: string;
  version: string | null;
  releasePath?: string | null;
  remoteEntryPath: string | null;
  frontendVersion?: string | null;
  backendVersion?: string | null;
  contractVerified?: boolean | null;
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
      apiBaseUrl: string;
    }
  >;
};
