# MFE Upgrade POC — Option C: React 16 + React 19 in the default share scope

A reference **Micro-Frontend (MFE)** architecture built with **Webpack 5 Module
Federation**, used to evaluate two strategies for gradually upgrading a single
micro-frontend from **React 16 to React 19** while the other applications stay on
React 16.

This repository is **Part 3 of a three-part, spec-driven project** described in
[`docs/initial_prd.md`](docs/initial_prd.md). You are on
`migration/react19-multi-version-default-scope` (**Option C**), which branches from
the same verified baseline commit as the `main` Part 1 baseline: `mfe-app-1` runs
React 19.3.1 and all four builds share ONE default Module Federation scope with
`singleton: false`, so two React generations coexist on the page.
The full write-up is [`docs/migration-option-c.md`](docs/migration-option-c.md).

## What is in this branch

Four independent Webpack builds; two React generations in one default share scope:

| Application    | Responsibility                              | React     | Port |
| -------------- | ------------------------------------------- | --------- | ---- |
| `container-app`| Shell, navigation, remote loading, diagnostics | 16.14.0 | 3000 |
| `mfe-app-1`    | Redux counter + validated form + local routes  | **19.3.1** | 3001 |
| `mfe-app-2`    | Redux profile management + form validation     | 16.14.0 | 3002 |
| `mfe-app-3`    | Redux report filtering + result display        | 16.14.0 | 3003 |

The container loads all three remotes through Module Federation. Each remote
exposes a **framework-independent mount/unmount contract** and owns its own React
root — the container never renders remote components inside its own React tree.
The container needs **no code change** to mount a React 19 remote: both generations
implement the same contract, and no React Bridge is used.

## Technology stack

- **React / React DOM** 16.14.0 + 19.3.1 (one `default` scope, `singleton: false`,
  `strictVersion: true`, generation-specific `requiredVersion`)
- **Webpack** 5 + **ModuleFederationPlugin**
- **Babel** 7 (classic JSX runtime for the React 16 apps; `mfe-app-1` uses the
  automatic runtime through its own `babel.config.js`)
- **Tailwind CSS** 2.2 (styling)
- **Redux** 4 (React 16 apps) / **Redux** 5 + **React Redux** 9 (App 1)
- **React Router DOM** 5 (container + App 1 local routing)
- **Jest** 26 + **React Testing Library** 11 (React 16 workspaces) and
  **Jest** 30 + **RTL** 16 (`mfe-app-1`) — two Jest projects
- **Playwright** (integration + E2E, against real production builds)

Exact, verified versions and documented deviations from the PRD's candidate
versions are in [`docs/dependency-management.md`](docs/dependency-management.md).

## Prerequisites

- **Node.js** 18+ (developed and CI-tested on Node 20; also verified on Node 24)
- **npm** 8+ (the repository uses npm workspaces)

## Installation

```bash
npm ci          # reproducible clean install from package-lock.json
# or
npm install
```

## Run locally

```bash
# Start all four dev servers (container + 3 remotes) together:
npm start

# Or run one application independently (still works standalone):
npm run start:container   # http://localhost:3000
npm run start:app1        # http://localhost:3001
npm run start:app2        # http://localhost:3002
npm run start:app3        # http://localhost:3003
```

Open **http://localhost:3000** for the container. Remote URLs are configured in
`.env` (see [`.env.example`](.env.example)); they are not hardcoded in application code.

## Build

```bash
npm run build          # production build of all four apps into each app's dist/
npm run build:stats    # build + regenerate this branch's performance document
npm run preview        # serve the production builds on the same ports
npm run perf:measure   # drive the real page and record what the browser fetches
```

`build:stats` writes the document matching the branch's sharing mode —
`docs/performance-baseline.md` on the React 16 baseline, `docs/performance-option-c.md`
here — so a branch can never overwrite another branch's measurements.

## Test

```bash
npm run test:unit          # both Jest projects: React 16 stack + React 19 stack
npm run test:unit:legacy   # container, mfe-app-2, mfe-app-3, shared modules (Jest 26)
npm run test:unit:app1     # mfe-app-1 only (Jest 30, React 19)
npm run test:unit:container   # a single React 16 app (also :app2 :app3 :shared)
npm run test:integration   # real Module Federation runtime via Playwright (builds first)
npm run test:e2e           # full user journeys via Playwright
npm run test:coverage      # unit coverage for both projects
npm run test:all           # unit + integration + e2e
npm run lint               # ESLint
```

Integration and E2E suites serve the **production builds** in a real browser and
drive the actual Webpack Module Federation runtime (no mocked remotes). See
[`docs/testing-guide.md`](docs/testing-guide.md).

## Documentation

| Document                                                              | Contents                                            |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)                          | System architecture and the mount contract          |
| [docs/application-structure.md](docs/application-structure.md)        | Repository and per-application layout               |
| [docs/development-guide.md](docs/development-guide.md)                | Commands, ports, running apps independently/together|
| [docs/testing-guide.md](docs/testing-guide.md)                        | The three testing levels and how to run them        |
| [docs/module-federation-guide.md](docs/module-federation-guide.md)    | Federation configuration deep dive                  |
| [docs/dependency-management.md](docs/dependency-management.md)        | Exact versions, peer checks, documented deviations  |
| [docs/performance-baseline.md](docs/performance-baseline.md)          | Generated bundle-size baseline (Part 1 reference)   |
| [docs/performance-option-c.md](docs/performance-option-c.md)          | Generated build statistics for this branch          |
| [docs/performance-option-c-runtime.md](docs/performance-option-c-runtime.md) | Generated browser network measurements   |
| [docs/migration-option-c.md](docs/migration-option-c.md)              | **Option C: configuration, resolution evidence, limitations, rollback** |
| [docs/branching-and-migration-guide.md](docs/branching-and-migration-guide.md) | How Parts 2 and 3 branch from this baseline |
| [docs/adr/](docs/adr/)                                                | Architecture Decision Records                       |

## Status: Part 3 (Option C) complete — awaiting human verification

Per the PRD's mandatory workflow, this branch **stops here for human review**. The
agent did not push, merge, or commit. Option B (`migration/react19-share-scopes`)
and Option C both start from baseline commit `163dd26` and are independently
reviewable; neither inherits code from the other.

> This is a deliberately React-16-era reference scaffold for evaluating a
> migration. It is **not** a production dependency recommendation; several
> dependencies are legacy. See the security notes in
> [`docs/dependency-management.md`](docs/dependency-management.md).
