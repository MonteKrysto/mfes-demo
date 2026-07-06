# MFE Deployment

This app is a local release-management console for the micro frontend demo. It uses an Express API to talk to Azure Blob Storage. In local development, that storage is Azurite from `docker-compose.yml`.

Backend images are stored separately in the local Docker Registry at `localhost:5001`. That mirrors the production split where Azure Blob Storage would hold release metadata and frontend artifacts, while Azure Container Registry would hold backend images.

## Storage Model

One blob container is used:

- `mfe-artifacts`

Immutable remote builds are stored by remote and version:

- `remotes/frodos-franks/versions/{version}/...`
- `remotes/boromirs-burgers/versions/{version}/...`

Each version stores the full Vite build output, not only `remoteEntry.js`, because Module Federation remote entries load sibling JS and CSS chunks. Release bundles also store `backend-snapshot.json`, which is what deployed-style hosts read through the deployment API runtime proxy.

Backend image metadata is stored in the release bundle, but the actual backend image is pushed to the local Docker Registry:

- `backend.json` stores the image tag and digest.
- `release.json` embeds the backend metadata alongside the frontend artifact and contract result.
- `backend-snapshot.json` remains the local runtime simulation for deployed-style API responses.

Environment manifests are mutable pointers:

- `environments/dev/manifest.json`
- `environments/staging/manifest.json`
- `environments/prod/manifest.json`

Dedicated host URLs read runtime host manifests from the API:

- `http://localhost:5183` uses `http://localhost:5050/api/environments/dev/host-manifest`
- `http://localhost:5184` uses `http://localhost:5050/api/environments/staging/host-manifest`
- `http://localhost:5185` uses `http://localhost:5050/api/environments/prod/host-manifest`

`http://localhost:5173` is the local integration host. It loads local remote entries and is not a deployed environment.

Changing an environment manifest changes which remote version the host loads on refresh. The host does not need to be rebuilt for a remote version change.

## Run Locally

```bash
pnpm azurite:up
pnpm dev:deployment
```

URLs:

- Deployment UI: http://localhost:5176
- Deployment API: http://localhost:5050
- Azurite Blob endpoint: http://localhost:10000/devstoreaccount1
- Local Docker Registry catalog: http://localhost:5001/v2/_catalog

## Publish A Remote

```bash
pnpm publish:frodos-franks
pnpm publish:boromirs-burgers
```

Publishing runs that remote's lint, tests, and build. The build sets `VITE_APP_BASE_PATH` to the version folder's public storage URL so `remoteEntry.js` can load its sibling chunks and styles from the same immutable artifact prefix.

Versions default to:

```text
{timestamp}-{git-sha}-{branch-name}
```

You can override with:

```bash
BUILD_VERSION=20260630-demo-main pnpm publish:frodos-franks
```

## Promotion

Publishing creates a verified release bundle in storage. It does not deploy that bundle to any environment by itself. The bundle includes the frontend artifact, backend image metadata, backend response snapshot, and contract verification result.

The UI supports:

- listing saved versions by remote
- assigning any version to any environment
- promoting a remote from one environment to another
- promoting the latest saved remote version to `prod`
