import cors from "cors";
import express from "express";
import mime from "mime";
import { deploymentConfig } from "./config.js";
import {
  ensureContainer,
  getContainerClient,
  getEnvironmentManifest,
  getLatestRemoteVersion,
  listStorageContainers,
  listStoragePath,
  listRemoteVersions,
  readJsonBlob,
  saveEnvironmentManifest,
  toHostManifest
} from "./storage.js";
import type { RemoteVersion } from "./types.js";

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
    response.json(await getEnvironmentManifest(request.params.environment));
  } catch (error) {
    next(error);
  }
});

app.get("/api/environments/:environment/host-manifest", async (request, response, next) => {
  try {
    response.json(toHostManifest(await getEnvironmentManifest(request.params.environment)));
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
    const version = String(request.body.version ?? "");
    const manifest = await getEnvironmentManifest(request.params.environment);
    const meta = await readJsonBlob<RemoteVersion>(`remotes/${request.params.remoteId}/versions/${version}/meta.json`);

    if (!meta) {
      response.status(404).json({ error: `Version ${version} was not found for ${request.params.remoteId}` });
      return;
    }

    manifest.remotes[request.params.remoteId] = {
      remoteId: request.params.remoteId,
      version: meta.version,
      remoteEntryPath: meta.remoteEntryPath,
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

    if (!version && fromEnvironment) {
      const source = await getEnvironmentManifest(fromEnvironment);
      version = source.remotes[remoteId]?.version ?? undefined;
    }

    if (!version) {
      version = (await getLatestRemoteVersion(remoteId))?.version;
    }

    if (!version) {
      response.status(404).json({ error: `No version found for ${remoteId}` });
      return;
    }

    const meta = await readJsonBlob<RemoteVersion>(`remotes/${remoteId}/versions/${version}/meta.json`);

    if (!meta) {
      response.status(404).json({ error: `Version ${version} was not found for ${remoteId}` });
      return;
    }

    const manifest = await getEnvironmentManifest(toEnvironment);
    manifest.remotes[remoteId] = {
      remoteId,
      version: meta.version,
      remoteEntryPath: meta.remoteEntryPath,
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
