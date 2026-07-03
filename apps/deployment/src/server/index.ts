import cors from "cors";
import express from "express";
import mime from "mime";
import { deploymentConfig } from "./config.js";
import {
  ensureContainer,
  getContainerClient,
  getEnvironmentManifest,
  getLatestRemoteRelease,
  listRemoteReleases,
  listStorageContainers,
  listStoragePath,
  listRemoteVersions,
  readJsonBlob,
  releaseManifestPath,
  saveEnvironmentManifest,
  storageUrl
} from "./storage.js";
import type { EnvironmentManifest, HostManifest, RemoteRelease } from "./types.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/setup", async (_request, response, next) => {
  try {
    await ensureContainer();

    for (const environment of deploymentConfig.environments) {
      await saveEnvironmentManifest(await getEnvironmentManifest(environment));
    }

    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/remotes", (_request, response) => {
  response.json({ remotes: deploymentConfig.remotes });
});

app.get("/api/remotes/:remoteId/versions", async (request, response, next) => {
  try {
    response.json({ versions: await listRemoteVersions(request.params.remoteId) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/remotes/:remoteId/releases", async (request, response, next) => {
  try {
    response.json({ releases: await listRemoteReleases(request.params.remoteId) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/environments", async (_request, response, next) => {
  try {
    const environments = await Promise.all(
      deploymentConfig.environments.map(async (environment) => getEnvironmentManifest(environment))
    );

    response.json({ environments });
  } catch (error) {
    next(error);
  }
});

app.get("/api/environments/:environment/manifest", async (request, response, next) => {
  try {
    if (!isConfiguredEnvironment(request.params.environment)) {
      response.status(404).json({ error: `Unknown environment ${request.params.environment}` });
      return;
    }

    response.json(await getEnvironmentManifest(request.params.environment));
  } catch (error) {
    next(error);
  }
});

app.get("/api/environments/:environment/host-manifest", async (request, response, next) => {
  try {
    if (!isConfiguredEnvironment(request.params.environment)) {
      response.status(404).json({ error: `Unknown environment ${request.params.environment}` });
      return;
    }

    response.json(await toDeployableHostManifest(await getEnvironmentManifest(request.params.environment)));
  } catch (error) {
    next(error);
  }
});

app.get("/api/runtime/:environment/:remoteId/*", async (request, response, next) => {
  try {
    const { environment, remoteId } = request.params;

    if (!isConfiguredEnvironment(environment)) {
      response.status(404).json({ error: `Unknown environment ${environment}` });
      return;
    }

    const manifest = await getEnvironmentManifest(environment);
    const assigned = manifest.remotes[remoteId];

    if (!assigned?.version) {
      response.status(404).json({ error: `No release is assigned to ${remoteId} in ${environment}` });
      return;
    }

    const release = await readJsonBlob<RemoteRelease>(releaseManifestPath(remoteId, assigned.version));

    if (!release?.backend.snapshotPath) {
      response.status(404).json({ error: `No backend snapshot is available for ${remoteId} ${assigned.version}` });
      return;
    }

    const snapshot = await readJsonBlob<Record<string, unknown>>(release.backend.snapshotPath);

    if (!snapshot) {
      response.status(404).json({ error: `Backend snapshot ${release.backend.snapshotPath} was not found` });
      return;
    }

    const wildcardParams = request.params as unknown as { "0"?: string; "": string[] };
    const runtimePath = `/${wildcardParams["0"] ?? wildcardParams[""].join("/")}`;
    const body = snapshot[runtimePath];

    if (!body) {
      response.status(404).json({ error: `No backend snapshot response found for ${runtimePath}` });
      return;
    }

    response.json(body);
  } catch (error) {
    next(error);
  }
});

app.get("/api/storage/containers", async (_request, response, next) => {
  try {
    response.json({
      configuredContainer: deploymentConfig.containerName,
      containers: await listStorageContainers()
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/storage/containers/:containerName/blobs", async (request, response, next) => {
  try {
    response.json(await listStoragePath(request.params.containerName, String(request.query.prefix ?? "")));
  } catch (error) {
    next(error);
  }
});

app.put("/api/environments/:environment/remotes/:remoteId", async (request, response, next) => {
  try {
    if (!isConfiguredEnvironment(request.params.environment)) {
      response.status(404).json({ error: `Unknown environment ${request.params.environment}` });
      return;
    }

    const version = String(request.body.version ?? "");
    const manifest = await getEnvironmentManifest(request.params.environment);
    const release = await readJsonBlob<RemoteRelease>(releaseManifestPath(request.params.remoteId, version));

    if (!release) {
      response.status(404).json({ error: `Release ${version} was not found for ${request.params.remoteId}` });
      return;
    }

    if (!release.contract.verified) {
      response.status(409).json({ error: `Release ${version} has not passed contract verification` });
      return;
    }

    if (!isDeployableRelease(release)) {
      response.status(409).json({ error: deployableReleaseError(release) });
      return;
    }

    manifest.remotes[request.params.remoteId] = {
      remoteId: request.params.remoteId,
      version: release.version,
      releasePath: release.releasePath,
      remoteEntryPath: release.frontend.remoteEntryPath,
      frontendVersion: release.frontend.version,
      backendVersion: release.backend.version,
      contractVerified: release.contract.verified,
      updatedAt: new Date().toISOString()
    };

    await saveEnvironmentManifest(manifest);
    response.json(await getEnvironmentManifest(request.params.environment));
  } catch (error) {
    next(error);
  }
});

app.post("/api/promote", async (request, response, next) => {
  try {
    const remoteId = String(request.body.remoteId ?? "");
    const toEnvironment = String(request.body.toEnvironment ?? "prod");
    const fromEnvironment = request.body.fromEnvironment ? String(request.body.fromEnvironment) : undefined;
    let version = request.body.version ? String(request.body.version) : undefined;

    if (!isConfiguredEnvironment(toEnvironment)) {
      response.status(404).json({ error: `Unknown environment ${toEnvironment}` });
      return;
    }

    if (fromEnvironment && !isConfiguredEnvironment(fromEnvironment)) {
      response.status(404).json({ error: `Unknown environment ${fromEnvironment}` });
      return;
    }

    if (!version && fromEnvironment) {
      const source = await getEnvironmentManifest(fromEnvironment);
      version = source.remotes[remoteId]?.version ?? undefined;
    }

    if (!version) {
      version = (await getLatestRemoteRelease(remoteId))?.version;
    }

    if (!version) {
      response.status(404).json({ error: `No release found for ${remoteId}` });
      return;
    }

    const release = await readJsonBlob<RemoteRelease>(releaseManifestPath(remoteId, version));

    if (!release) {
      response.status(404).json({ error: `Release ${version} was not found for ${remoteId}` });
      return;
    }

    if (!release.contract.verified) {
      response.status(409).json({ error: `Release ${version} has not passed contract verification` });
      return;
    }

    if (!isDeployableRelease(release)) {
      response.status(409).json({ error: deployableReleaseError(release) });
      return;
    }

    const manifest = await getEnvironmentManifest(toEnvironment);
    manifest.remotes[remoteId] = {
      remoteId,
      version: release.version,
      releasePath: release.releasePath,
      remoteEntryPath: release.frontend.remoteEntryPath,
      frontendVersion: release.frontend.version,
      backendVersion: release.backend.version,
      contractVerified: release.contract.verified,
      updatedAt: new Date().toISOString()
    };
    await saveEnvironmentManifest(manifest);

    response.json(await getEnvironmentManifest(toEnvironment));
  } catch (error) {
    next(error);
  }
});

app.get("/storage/*", async (request, response, next) => {
  try {
    const wildcardParams = request.params as unknown as { "0"?: string; "": string[] };
    const blobPath = wildcardParams["0"] ?? wildcardParams[""].join("/");
    const blob = getContainerClient().getBlockBlobClient(blobPath);

    if (!(await blob.exists())) {
      response.status(404).send("Blob not found");
      return;
    }

    const download = await blob.download();
    response.setHeader("access-control-allow-origin", "*");
    response.setHeader("content-type", download.contentType ?? mime.getType(blobPath) ?? "application/octet-stream");
    download.readableStreamBody?.pipe(response);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ error: error instanceof Error ? error.message : "Unexpected error" });
});

app.listen(deploymentConfig.port, () => {
  console.log(`Deployment API listening on http://localhost:${deploymentConfig.port}`);
});

function isConfiguredEnvironment(environment: string) {
  return (deploymentConfig.environments as readonly string[]).includes(environment);
}

async function toDeployableHostManifest(manifest: EnvironmentManifest): Promise<HostManifest> {
  const remotes = await Promise.all(
    Object.entries(manifest.remotes).map(async ([remoteId, remote]) => {
      if (!remote.version || !remote.remoteEntryPath) {
        return null;
      }

      const release = await readJsonBlob<RemoteRelease>(releaseManifestPath(remoteId, remote.version));

      if (!release || !isDeployableRelease(release)) {
        return null;
      }

      return [
        remoteId,
        {
          version: remote.version,
          remoteEntryUrl: storageUrl(remote.remoteEntryPath),
          apiBaseUrl: `${deploymentConfig.publicBaseUrl}/api/runtime/${manifest.environment}/${remoteId}/api`
        }
      ] as const;
    })
  );

  return {
    environment: manifest.environment,
    generatedAt: new Date().toISOString(),
    remotes: Object.fromEntries(remotes.filter((remote): remote is NonNullable<typeof remote> => remote !== null))
  };
}

function isDeployableRelease(release: RemoteRelease) {
  return Boolean(release.frontend.remoteEntryPath && release.backend.snapshotPath && release.contract.verified);
}

function deployableReleaseError(release: RemoteRelease) {
  if (!release.backend.snapshotPath) {
    return `Release ${release.version} is a legacy build without a backend snapshot. Run fake CI again before assigning it to an environment.`;
  }

  if (!release.frontend.remoteEntryPath) {
    return `Release ${release.version} does not include a frontend remote entry.`;
  }

  return `Release ${release.version} is not deployable.`;
}
