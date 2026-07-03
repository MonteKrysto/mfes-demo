# Frodos Franks

Frodos Franks is a standalone React + TypeScript + Vite application. It can be developed and deployed independently from the host, while still exposing a Module Federation `mount()` entry for host integration.

## Local Standalone Work

```bash
pnpm install
pnpm --filter frodos-franks dev
```

Standalone URL:

- http://localhost:5174

Routes are owned by this app:

- `/`
- `/orders`
- `/locations`
- `/catering`

## Standalone Dev Deployment

Copy `.env.example` to `.env.local` when this app is deployed under a path instead of at an origin root.

```bash
VITE_APP_BASE_PATH=/frodos-franks/ pnpm --filter frodos-franks build
pnpm --filter frodos-franks preview
```

`VITE_APP_BASE_PATH` controls both Vite asset URLs and the standalone React Router basename.

## Host Integration

The host consumes the federated file at:

- `/assets/remoteEntry.js`

When mounted by the host, the host passes a basename to `mount()`. That keeps host URLs such as `/frodos-franks/orders` working without requiring this app to know the host route at build time.
