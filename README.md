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

- Host: http://localhost:5173
- Frodos Franks: http://localhost:5174
- Boromirs Burgers: http://localhost:5175
- Shire Sides: http://localhost:5177
- Gondor Sauces: http://localhost:5178

Host app routes:

- Frodos Franks: http://localhost:5173/frodos-franks
- Boromirs Burgers: http://localhost:5173/boromirs-burgers
- Nested Shire Sides: http://localhost:5173/frodos-franks/shire-sides
- Nested Gondor Sauces: http://localhost:5173/boromirs-burgers/gondor-sauces

The `dev` script builds the remote applications first, then runs the host dev server and serves each remote build with its API. This matches the Vite federation plugin behavior for remotes.

## Docker Compose

The full local stack can also run in Docker Compose. There are two modes.

Runtime/preview mode starts Azurite, the deployment app, the host, every remote UI, and every API. Remote UIs build and then run Vite preview, so `assets/remoteEntry.js` exists.

```bash
make build
make up
```

Useful compose URLs:

- Host UI: http://localhost:5173
- Deployment UI: http://localhost:5176
- Deployment API: http://localhost:5050
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

The host still loads remotes from the deployment manifest at:

```text
http://localhost:5050/api/environments/dev/host-manifest
```

That means editing a remote's source and seeing it at its standalone URL is immediate, but the host only sees that change after a fake CI publish updates the remote artifact in Azurite and promotes it to `dev`.

Fake CI publish commands:

```bash
make fake-ci-frodos-franks
make fake-ci-boromirs-burgers
make fake-ci-shire-sides
make fake-ci-gondor-sauces
```

After one of those finishes, refresh the host route. The host fetches the latest `dev` manifest and loads the newly published `remoteEntry.js`.

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

The publish flow runs lint, tests, and build for the selected remote, then uploads the full `dist` folder to:

```text
remotes/{remote-id}/versions/{timestamp}-{sha}-{branch}/
```

Environment manifests are stored in the same container:

```text
environments/dev/manifest.json
environments/staging/manifest.json
environments/prp/manifest.json
environments/prod/manifest.json
```

The host now reads its remote URLs from a runtime manifest:

```text
http://localhost:5050/api/environments/dev/host-manifest
```

If that API is not running, the host falls back to the local remote preview URLs on ports `5174` and `5175`.

This runtime manifest is the key to avoiding host redeployments: the host build contains the manifest URL, not fixed remote artifact URLs. Updating the manifest changes which remote versions load on the next browser refresh.
