# Development Guide

## Ports

| Application     | React | Dev server | Production preview |
| --------------- | ----- | ---------- | ------------------ |
| `container-app` | 16.14.0 | 3000     | 3000               |
| `mfe-app-1`     | **19.3.1** | 3001 | 3001               |
| `mfe-app-2`     | 16.14.0 | 3002     | 3002               |
| `mfe-app-3`     | 16.14.0 | 3003     | 3003               |

All four participate in the **one `default` Module Federation scope** (Option C), so a
remote may be opened standalone (`:3001`) or mounted by the container (`:3000`) without any
change to how it is built.

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

To see which React runtime each application actually resolved, open the
**Diagnostics** tab: it probes all three remotes through the real federation runtime and
reports, per application, the React/React DOM version, renderer, share scope, and the
**identity** of the module instance it got — plus a page-wide census of how many React
instances the page is running and which applications share each one.

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
npm run build:stats    # production build + regenerate this branch's performance document
npm run preview        # serve each app's dist/ on its port (for manual QA of prod)
npm run perf:measure   # drive the real page and record browser-side fetches/timings
```

`build:stats` picks its output document from the sharing configuration it finds, so on this
branch it writes `docs/performance-option-c.md` and leaves the Part 1
`docs/performance-baseline.md` untouched.

## Lint and format

```bash
npm run lint           # ESLint (eslint:recommended + react + react-hooks)
npm run lint:fix
npm run format         # Prettier
```

The React 19 workspace is covered by an ESLint `overrides` block that turns off the two
classic-runtime JSX rules for `mfe-app-1` and its tests (with the React 19 automatic JSX
runtime, `React` must *not* be in scope for JSX).

## Environment notes

- Developed on **Node.js 24**, CI-tested on **Node.js 20** (both verified). npm
  workspaces requires npm 7+.
- Babel: the root `babel.config.js` uses the **classic JSX runtime** (React 16 predates the
  automatic runtime, so those apps keep `React` in scope). `mfe-app-1/babel.config.js`
  overrides it with **`runtime: "automatic"`** for the React 19 workspace. babel-loader runs
  with `rootMode: "upward"` from each app's own directory, so the app-level file becomes the
  Babel root for that build only.
- Two Jest stacks coexist: Jest 26 + RTL 11 at the root for the React 16 workspaces, and
  Jest 30 + RTL 16 installed inside `mfe-app-1` (`npm run test:unit:app1`).
- Dev-mode console output differs between the two React dev builds. The React 16 container
  logs two pre-existing `NavLink` warnings inherited from `main`
  ([documented here](./migration-option-c.md#64-pre-existing-container-defect-left-untouched));
  App 1's equivalent warning was fixed as part of the React 19 migration. Production builds
  (what the test suites and `npm run preview` serve) log nothing.
- Tailwind `purge` is force-enabled in `tailwind.config.js` because webpack's
  `--mode production` does not set `process.env.NODE_ENV` for PostCSS plugins (see
  [dependency-management.md](dependency-management.md)).
