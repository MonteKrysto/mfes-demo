# MFEs Demo

This repository contains separate React + TypeScript + Vite applications wired together with Vite Module Federation:

- `apps/host` - host shell that launches remote apps
- `apps/frodos-franks` - Frodos Franks, an independent remote app that also hosts a child remote
- `apps/boromirs-burgers` - Boromirs Burgers, an independent remote app that also hosts a child remote
- `apps/franks-sides` - Shire Sides, a child remote loaded by Frodos Franks
- `apps/burgers-sauces` - Gondor Sauces, a child remote loaded by Boromirs Burgers
- `apps/deployment` - local deployment control app and API

The monorepo only coordinates scripts and dependency installation. There is no shared package, shared UI library, or shared runtime code between the applications.

Each remote exposes only a federated `mount()` function. The consuming host loads that function and gives it a DOM element; the remote owns its own React root, router, styles, API base URL, and dependencies.

Every app now has a small Express API:

- Host API: http://localhost:6073/api/host/status
- Frodos Franks API: http://localhost:6074/api/franks/menu
- Boromirs Burgers API: http://localhost:6075/api/burgers/grill
- Shire Sides API: http://localhost:6077/api/shire-sides/sides
- Gondor Sauces API: http://localhost:6078/api/gondor-sauces/sauces

## Run

```bash
pnpm install
pnpm dev
```

Default dev URLs:

- Local integration host: http://localhost:5173
- Frodos Franks: http://localhost:5174
- Boromirs Burgers: http://localhost:5175
- Shire Sides: http://localhost:5177
- Gondor Sauces: http://localhost:5178

Local host routes:

- Frodos Franks: http://localhost:5173/frodos-franks
- Boromirs Burgers: http://localhost:5173/boromirs-burgers
- Nested Shire Sides: http://localhost:5173/frodos-franks/shire-sides
- Nested Gondor Sauces: http://localhost:5173/boromirs-burgers/gondor-sauces

`5173` is local integration only. It loads the local remote dev/preview URLs and is expected to reflect local source changes.

The `dev` script builds the remote applications first, then runs the host dev server and serves each remote build with its API. This matches the Vite federation plugin behavior for remotes.

## Docker Compose

The full local stack can also run in Docker Compose. There are two modes.

Runtime/preview mode starts Azurite, the deployment app, the host, every remote UI, and every API. Remote UIs build and then run Vite preview, so `assets/remoteEntry.js` exists.

```bash
make build
make up
```

Useful compose URLs:

- Local integration host: http://localhost:5173
- Dev environment host: http://localhost:5183
- Staging environment host: http://localhost:5184
- Prod environment host: http://localhost:5185
- Deployment UI: http://localhost:5176
- Deployment API: http://localhost:5050
- Local Docker Registry: http://localhost:5001/v2/_catalog
- Frodos Franks UI/API: http://localhost:5174 / http://localhost:6074/api/franks/menu
- Boromirs Burgers UI/API: http://localhost:5175 / http://localhost:6075/api/burgers/grill
- Shire Sides UI/API: http://localhost:5177 / http://localhost:6077/api/shire-sides/sides
- Gondor Sauces UI/API: http://localhost:5178 / http://localhost:6078/api/gondor-sauces/sauces

Stop the stack:

```bash
make down
```

If a port is blocked, inspect the local listener:

```bash
make ports
```

Hot-reload development mode bind-mounts the application `src` directories into the containers and runs each UI with Vite dev plus each API with `tsx watch`.

```bash
make dev-build
make dev-up
```

In hot-reload mode, each remote team works against its standalone URL:

- Frodos Franks: http://localhost:5174
- Boromirs Burgers: http://localhost:5175
- Shire Sides: http://localhost:5177
- Gondor Sauces: http://localhost:5178

The local integration host and deployed-style environment hosts are intentionally separate:

```text
http://localhost:5173  -> local remote entries on 5174/5175
http://localhost:5183  -> http://localhost:5050/api/environments/dev/host-manifest
http://localhost:5184  -> http://localhost:5050/api/environments/staging/host-manifest
http://localhost:5185  -> http://localhost:5050/api/environments/prod/host-manifest
```

That means editing a remote's source and seeing it at its standalone URL or the local integration host is immediate. A deployed-style host reads frontend artifacts and backend snapshots from the assigned release bundle, so it only sees a change after fake CI publishes a new release and the deployment UI assigns that release to the environment.

Fake CI publish commands create verified release bundles only. They do not assign that release to `dev`, `staging`, or `prod`; use the deployment UI to choose which environment should point at the new release. A release bundle contains the frontend artifact reference, backend image metadata, a backend response snapshot, and a stored frontend/backend contract verification result.

The local stack uses two Azure-adjacent pieces:

- Azurite stores frontend artifacts, release manifests, backend metadata, and backend snapshots.
- The local Docker Registry stores backend container images, acting as the local equivalent of Azure Container Registry.

The fake CI targets build and push a backend image such as `localhost:5001/mfes-demo/frodos-franks-api:{version}` before writing the release metadata to Azurite.

```bash
make fake-ci-frodos-franks
make fake-ci-boromirs-burgers
make fake-ci-shire-sides
make fake-ci-gondor-sauces
```

Backend-only and frontend-only release simulations are also available:

```bash
make fake-ci-frodos-franks-backend
make fake-ci-frodos-franks-frontend

make fake-ci-boromirs-burgers-backend
make fake-ci-boromirs-burgers-frontend
```

Backend-only releases reuse the currently published frontend artifact and publish a new backend version in the release manifest. Frontend-only releases build a new frontend artifact and mark the backend metadata as reused.

After one of those finishes, open the deployment UI, select the new release for the target environment, and refresh that environment's host URL. The host fetches that environment's manifest and loads the assigned `remoteEntry.js`.

This separation is intentional: standalone remote development uses hot reload; host integration uses built remote artifacts from the bucket, matching the deployment model.

## Independent Remote Workflows

Each remote can also be treated like its own repository. It has its own package scripts, routing, Vite config, Tailwind config, shadcn-style components, environment file, and README.

Run Frodos Franks without the host:

```bash
pnpm dev:frodos-franks
```

Run Boromirs Burgers without the host:

```bash
pnpm dev:boromirs-burgers
```

Run the child remotes without either parent remote:

```bash
pnpm dev:shire-sides
pnpm dev:gondor-sauces
```

Those commands start the standalone remote apps directly:

- Frodos Franks: http://localhost:5174
- Boromirs Burgers: http://localhost:5175
- Shire Sides: http://localhost:5177
- Gondor Sauces: http://localhost:5178

The remotes can be built and previewed independently:

```bash
pnpm build:frodos-franks
pnpm preview:frodos-franks

pnpm build:boromirs-burgers
pnpm preview:boromirs-burgers

pnpm build:shire-sides
pnpm preview:shire-sides

pnpm build:gondor-sauces
pnpm preview:gondor-sauces
```

For a standalone dev deployment under a path, configure the remote's own `VITE_APP_BASE_PATH` before building. For example:

```bash
VITE_APP_BASE_PATH=/frodos-franks/ pnpm build:frodos-franks
VITE_APP_BASE_PATH=/boromirs-burgers/ pnpm build:boromirs-burgers
VITE_APP_BASE_PATH=/shire-sides/ pnpm build:shire-sides
VITE_APP_BASE_PATH=/gondor-sauces/ pnpm build:gondor-sauces
```

That value belongs to the remote app, not the host. It controls the remote's standalone asset paths and React Router basename.

When the host consumes a remote, the host still controls the host-facing route by passing a basename into the remote `mount()` call. That lets standalone remote URLs and host-mounted remote URLs evolve independently.

When a restaurant remote consumes a child remote, it does the same thing:

- Frodos Franks passes `/frodos-franks/shire-sides` to Shire Sides when mounted inside the top-level host.
- Boromirs Burgers passes `/boromirs-burgers/gondor-sauces` to Gondor Sauces when mounted inside the top-level host.

## Local Deployment Control

This repo also includes a local deployment control app in `apps/deployment`. It models an Azure-hosted remote artifact flow using Azurite.

Start local Azure Blob emulation:

```bash
pnpm azurite:up
```

Start the deployment UI and API:

```bash
pnpm dev:deployment
```

Deployment URLs:

- UI: http://localhost:5176
- API: http://localhost:5050
- Azurite Blob endpoint: http://localhost:10000/devstoreaccount1

The deployment UI includes an Azurite storage browser. Open http://localhost:5176 and use the "Azurite storage browser" section to inspect the `mfe-artifacts` blob container, browse folders such as `remotes/` and `environments/`, and preview uploaded remote entries, chunks, CSS, and manifests.

Publish remote artifacts into Azurite:

```bash
pnpm publish:frodos-franks
pnpm publish:boromirs-burgers
pnpm publish:shire-sides
pnpm publish:gondor-sauces
```

The publish flow runs lint, tests, provider contract tests, and build for the selected remote, then uploads the full `dist` folder to:

```text
remotes/{remote-id}/versions/{timestamp}-{sha}-{branch}/
```

It also writes a release bundle to:

```text
releases/{remote-id}/versions/{timestamp}-{sha}-{branch}/release.json
releases/{remote-id}/versions/{timestamp}-{sha}-{branch}/backend.json
releases/{remote-id}/versions/{timestamp}-{sha}-{branch}/backend-snapshot.json
releases/{remote-id}/versions/{timestamp}-{sha}-{branch}/contracts/frontend-backend.contract.json
```

The release bundle is the deployable unit. Environments select release versions, not raw frontend versions. The host manifest is generated from the release's frontend `remoteEntry.js` and an environment-scoped API proxy URL. That proxy serves the release's backend snapshot, so local API hot reload does not leak into deployed-style environment hosts.

Each remote owns a consumer contract at:

```text
apps/{remote}/src/contracts/frontend-backend.contract.json
```

Each backend verifies its provider response shape in:

```text
apps/{remote}/src/server/contract.test.ts
```

Environment manifests are stored in the same container:

```text
environments/dev/manifest.json
environments/staging/manifest.json
environments/prod/manifest.json
```

Deployed-style host instances read their remote URLs from runtime manifests:

```text
http://localhost:5183  -> environments/dev/manifest.json
http://localhost:5184  -> environments/staging/manifest.json
http://localhost:5185  -> environments/prod/manifest.json
```

If the deployment API is not running, the deployed-style hosts show a manifest error rather than falling back to local remote URLs.

This runtime manifest is the key to avoiding host redeployments: the environment host build contains the deployment API base URL and an environment name, not fixed remote artifact URLs. Updating an environment manifest changes which remote versions load for that environment on the next browser refresh.
