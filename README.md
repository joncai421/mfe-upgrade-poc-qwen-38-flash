# MFE Upgrade POC — Part 2: Option B (React 16 + React 19 via separate share scopes)

A reference **Micro-Frontend (MFE)** architecture built with **Webpack 5 Module
Federation**, used to evaluate two strategies for gradually upgrading a single
micro-frontend from **React 16 to React 19** while the other applications stay on
React 16.

This repository is **Part 2 of a three-part, spec-driven project** described in
[`docs/initial_prd.md`](docs/initial_prd.md). It is the **Option B** branch
(`migration/react19-share-scopes`), created from the verified Part 1 baseline
commit `163dd26` on `main`. Here **MFE App 1 runs React 19.3.1 in a `react19`
share scope** while the container, App 2 and App 3 keep React 16.14.0 in a
`react16` share scope. Read [`docs/migration-option-b.md`](docs/migration-option-b.md)
for the implementation, measurements, limitations and rollback path.

## What the applications run

Four independent Webpack builds; each React generation shares one runtime inside its own scope:

| Application    | Responsibility                              | React     | Share scope | Port |
| -------------- | ------------------------------------------- | --------- | ----------- | ---- |
| `container-app`| Shell, navigation, remote loading, diagnostics | 16.14.0 | `react16` | 3000 |
| `mfe-app-1`    | Redux counter + validated form + local routes  | **19.3.1** | `react19` | 3001 |
| `mfe-app-2`    | Redux profile management + form validation     | 16.14.0 | `react16` | 3002 |
| `mfe-app-3`    | Redux report filtering + result display        | 16.14.0 | `react16` | 3003 |

The container loads all three remotes through Module Federation. Each remote
exposes a **framework-independent mount/unmount contract** and owns its own React
root — the container never renders remote components inside its own React tree.

## Technology stack

- **React / React DOM** 16.14.0 (container, App 2, App 3) and **19.3.1** (App 1),
  `singleton: true` within each of the two share scopes
- **Webpack** 5 + **ModuleFederationPlugin** (`shareScope` per build and per remote)
- **Babel** 7 — classic JSX runtime for the React 16 apps, **automatic** runtime for App 1
- **Tailwind CSS** 2.2 (styling)
- **Redux** 4 + **React Redux** 7 (React 16 apps); **Redux** 5 + **React Redux** 9 (App 1)
- **React Router DOM** 5 (5.2.0 in the React 16 apps, 5.3.4 in App 1)
- **Jest** 26 + **React Testing Library** 11 for the React 16 apps; **Jest** 30 + **RTL** 16 for App 1
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
npm run build:stats    # build + regenerate docs/performance-option-b.md (sizes)
npm run perf:option-b  # measure the running page: real network requests, sizes, timings
npm run preview        # serve the production builds on the same ports
```

## Test

```bash
npm run test:unit           # BOTH unit projects: React 16 stack (Jest 26) + App 1 (Jest 30/RTL 16)
npm run test:unit:react16   # container + App 2 + App 3 only
npm run test:unit:app1      # App 1 (React 19) only  (also :container :app2 :app3)
npm run test:integration    # real Module Federation runtime via Playwright (builds first)
npm run test:e2e            # full user journeys via Playwright
npm run test:coverage       # coverage for both unit projects
npm run test:all            # unit + integration + e2e
npm run lint                # ESLint
```

Integration and E2E suites serve the **production builds** in a real browser and
drive the actual Webpack Module Federation runtime (no mocked remotes). See
[`docs/testing-guide.md`](docs/testing-guide.md). The `/diagnostics` screen reports
the React runtime each application actually resolved, and the browser suites assert
against it (expected matrix in [`tests/expectations.js`](tests/expectations.js)).

## Documentation

| Document                                                              | Contents                                            |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)                          | System architecture and the mount contract          |
| [docs/application-structure.md](docs/application-structure.md)        | Repository and per-application layout               |
| [docs/development-guide.md](docs/development-guide.md)                | Commands, ports, running apps independently/together|
| [docs/testing-guide.md](docs/testing-guide.md)                        | The three testing levels and how to run them        |
| [docs/module-federation-guide.md](docs/module-federation-guide.md)    | Federation configuration deep dive                  |
| [docs/dependency-management.md](docs/dependency-management.md)        | Exact versions, peer checks, documented deviations  |
| [docs/performance-baseline.md](docs/performance-baseline.md)          | Generated Part 1 bundle-size baseline (reference)   |
| [docs/performance-option-b.md](docs/performance-option-b.md)          | Generated Option B bundle sizes                     |
| [docs/performance-option-b-runtime.md](docs/performance-option-b-runtime.md) | Generated Option B runtime/network measurements |
| [docs/migration-option-b.md](docs/migration-option-b.md)              | **Option B: scopes, config, migration, results, rollback** |
| [docs/branching-and-migration-guide.md](docs/branching-and-migration-guide.md) | How Parts 2 and 3 branch from this baseline |
| [docs/adr/](docs/adr/)                                                | Architecture Decision Records                       |

## Status: Part 2 (Option B) complete — awaiting human verification

Per the PRD's mandatory workflow, **Part 2 stops here for human review**. The
developer verifies and pushes `migration/react19-share-scopes`. Part 3 (Option C:
React 16 + React 19 as multiple versions in the **default** share scope) must start
in a new session from the same verified baseline commit `163dd26` on `main` — not
from this branch. Do **not** merge either migration branch into `main` automatically.

> This is a deliberately React-16-era reference scaffold for evaluating a
> migration. It is **not** a production dependency recommendation; several
> dependencies are legacy. See the security notes in
> [`docs/dependency-management.md`](docs/dependency-management.md).
