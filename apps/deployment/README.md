# MFE Deployment

This app is a local release-management console for the micro frontend demo. It uses an Express API to talk to Azure Blob Storage. In local development, that storage is Azurite from `docker-compose.yml`.

## Storage Model

One blob container is used:

- `mfe-artifacts`

Immutable remote builds are stored by remote and version:

- `remotes/frodos-franks/versions/{version}/...`
- `remotes/boromirs-burgers/versions/{version}/...`

Each version stores the full Vite build output, not only `remoteEntry.js`, because Module Federation remote entries load sibling JS and CSS chunks.

Environment manifests are mutable pointers:

- `environments/dev/manifest.json`
- `environments/staging/manifest.json`
- `environments/prp/manifest.json`
- `environments/prod/manifest.json`

The host reads a runtime host manifest from the API:

- `http://localhost:5050/api/environments/dev/host-manifest`

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

The UI supports:

- listing saved versions by remote
- assigning any version to any environment
- promoting a remote from one environment to another
- promoting the latest saved remote version to `prod`
