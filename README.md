# MFE Upgrade POC — React 16 Baseline (Part 1)

A reference **Micro-Frontend (MFE)** architecture built with **Webpack 5 Module
Federation**, used to evaluate two strategies for gradually upgrading a single
micro-frontend from **React 16 to React 19** while the other applications stay on
React 16.

This repository is **Part 1 of a three-part, spec-driven project** described in
[`docs/initial_prd.md`](docs/initial_prd.md). Part 1 establishes the React 16
baseline on the `main` branch. Parts 2 and 3 (the React 19 migration branches)
are implemented in separate sessions from the verified baseline commit.

## What is in the baseline

Four independent Webpack builds that share a single React runtime:

| Application    | Responsibility                              | React     | Port |
| -------------- | ------------------------------------------- | --------- | ---- |
| `container-app`| Shell, navigation, remote loading, diagnostics | 16.14.0 | 3000 |
| `mfe-app-1`    | Redux counter + validated form + local routes  | 16.14.0 | 3001 |
| `mfe-app-2`    | Redux profile management + form validation     | 16.14.0 | 3002 |
| `mfe-app-3`    | Redux report filtering + result display        | 16.14.0 | 3003 |

The container loads all three remotes through Module Federation. Each remote
exposes a **framework-independent mount/unmount contract** and owns its own React
root — the container never renders remote components inside its own React tree.

## Technology stack

- **React / React DOM** 16.14.0 (shared, `singleton: true`)
- **Webpack** 5 + **ModuleFederationPlugin**
- **Babel** 7 (classic JSX runtime — React 16 has no automatic runtime)
- **Tailwind CSS** 2.2 (styling)
- **Redux** 4 + **React Redux** 7 (per-app state)
- **React Router DOM** 5 (container + App 1 local routing)
- **Jest** 26 + **React Testing Library** 11 (unit)
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
npm run build:stats    # build + regenerate docs/performance-baseline.md
npm run preview        # serve the production builds on the same ports
```

## Test

```bash
npm run test:unit          # Jest + React Testing Library (all four apps)
npm run test:unit:app1     # a single app's unit suite (also :container :app2 :app3)
npm run test:integration   # real Module Federation runtime via Playwright (builds first)
npm run test:e2e           # full user journeys via Playwright
npm run test:coverage      # unit test coverage report
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
| [docs/performance-baseline.md](docs/performance-baseline.md)          | Generated bundle-size baseline                      |
| [docs/branching-and-migration-guide.md](docs/branching-and-migration-guide.md) | How Parts 2 and 3 branch from this baseline |
| [docs/adr/](docs/adr/)                                                | Architecture Decision Records                       |

## Status: Part 1 complete — awaiting human verification

Per the PRD's mandatory workflow, **Part 1 stops here for human review**. The
React 19 upgrade branches (Option B: separate share scopes; Option C:
multi-version default scope) must each start in a new session from the verified
baseline commit on `main`. Do **not** proceed to Part 2 or Part 3 automatically.

> This is a deliberately React-16-era reference scaffold for evaluating a
> migration. It is **not** a production dependency recommendation; several
> dependencies are legacy. See the security notes in
> [`docs/dependency-management.md`](docs/dependency-management.md).
