# Development Guide

## Ports

| Application     | Dev server | Production preview |
| --------------- | ---------- | ------------------ |
| `container-app` | 3000       | 3000               |
| `mfe-app-1`     | 3001       | 3001               |
| `mfe-app-2`     | 3002       | 3002               |
| `mfe-app-3`     | 3003       | 3003               |

## Install

```bash
npm ci        # from the committed lockfile (reproducible)
npm install   # ordinary install
```

## Run everything together

```bash
npm start
```

Starts all four webpack-dev-servers concurrently via `concurrently`. Open
<http://localhost:3000>. The container fetches each remote's `remoteEntry.js` from
the ports in `.env`.

## Run a single application

Each application is independently runnable — it renders standalone when opened on
its own port (useful for isolated development and debugging):

```bash
npm run start:container   # :3000
npm run start:app1        # :3001
npm run start:app2        # :3002
npm run start:app3        # :3003
```

> When you run only a remote (e.g. `start:app1`) but not the container, the
> container simply cannot reach it. When you run only the container but not the
> remotes, `RemoteSection` shows a per-remote **error** badge instead of crashing —
> verified by the container unit tests.

## Configure remote URLs

Remote URLs are **never hardcoded in application code**. They are read from `.env`
at build time and injected via `webpack.DefinePlugin`. Copy `.env.example` to
`.env` and adjust if a remote moves host/port:

```bash
REMOTE_APP1_URL=http://localhost:3001/remoteEntry.js
REMOTE_APP2_URL=http://localhost:3002/remoteEntry.js
REMOTE_APP3_URL=http://localhost:3003/remoteEntry.js
```

`container-app/webpack.config.js` maps these to the Module Federation `remotes`
object. Module **aliases** (`mfeApp1`, `mfeApp2`, `mfeApp3`) stay stable so
`import("mfeApp1/App")` never changes when only a URL changes.

## Build

```bash
npm run build          # production build of all four apps (each -> <app>/dist)
npm run build:stats    # production build + regenerate docs/performance-baseline.md
npm run preview        # serve each app's dist/ on its port (for manual QA of prod)
```

## Lint and format

```bash
npm run lint           # ESLint (eslint:recommended + react + react-hooks)
npm run lint:fix
npm run format         # Prettier
```

## Environment notes

- Developed on **Node.js 24**, CI-tested on **Node.js 20** (both verified). npm
  workspaces requires npm 7+.
- Babel uses the **classic JSX runtime** because React 16 predates the automatic
  runtime; every JSX file must have `React` in scope (it does).
- Tailwind `purge` is force-enabled in `tailwind.config.js` because webpack's
  `--mode production` does not set `process.env.NODE_ENV` for PostCSS plugins (see
  [dependency-management.md](dependency-management.md)).
