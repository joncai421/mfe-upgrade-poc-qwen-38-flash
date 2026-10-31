# Testing Guide

The project has **three testing levels**, all runnable locally and all wired into
CI (`.github/workflows/ci.yml`) in this order: install → lint → unit → build →
integration → e2e.

On this branch the unit level is split into **two Jest projects**, because a single Jest
stack cannot load both React generations: the React 16-era stack cannot render React 19
(`ReactDOM.render` is gone) and React 19's tooling (RTL 16) refuses to drive React 16.

## 1. Unit tests — two Jest projects

| Project | Config | Tooling | Covers |
| --- | --- | --- | --- |
| React 16 | `tests/unit/jest.config.js` | Jest 26 + RTL 11 + user-event 12 + jest-dom 5 | container, mfe-app-2, mfe-app-3, `shared/` |
| React 19 | `tests/unit/jest.app1.config.js` | Jest 30 + RTL 16 + user-event 14 + jest-dom 6.9.1 | mfe-app-1 |

Common config for both: jsdom environment, `babel-jest` transform with an explicit
`configFile` (so the classic/automatic JSX runtime never depends on the shell's working
directory), CSS mocked via `tests/__mocks__/styleMock.js`, matchers via
`tests/jest.setup.js` / `tests/jest.setup.app1.js`.

The React 19 project sets `rootDir` to the **app directory** — Jest resolves
`testEnvironment`, `babel-jest` and reporters relative to `rootDir`, so a repo-root
`rootDir` would pick the hoisted Jest 26 copies and crash — and it pins every
React-related specifier (`react`, `react/*`, `react-dom`, `react-dom/*`, `redux`,
`react-redux`, `react-router*`, `history`, `@testing-library/*`) to `mfe-app-1`'s own
`node_modules` through `moduleNameMapper`. The pinning also governs **transitive**
requires (`react-redux → use-sync-external-store → react`), which would otherwise load
React 16 into a React 19 test run.

```bash
npm run test:unit            # both projects
npm run test:unit:legacy     # React 16 project only
npm run test:unit:app1       # React 19 project only
npm run test:unit:container  # one app inside the React 16 project (also :app2 :app3 :shared)
npm run test:coverage        # coverage for both projects
```

Coverage per PRD 4.4:

- **container/** — remote registry shape; `RemoteSection` load→mount→runtime-info→
  unmount orchestration and error handling (via a fake remote module, so the
  container's own logic is tested without the browser).
- **mfe-app-1/** — `counterReducer`, `validateContact`, `Counter` interactions,
  `ContactForm` validation/submit, local routing + active-tab styling, and the
  **React 19** mount/unmount contract (`createRoot`, `act` imported from `react`,
  repeated mount/unmount, identity stability).
- **mfe-app-2/** — `profileReducer`, `validateProfile`, `ProfileForm` save +
  validation, mount/unmount contract.
- **mfe-app-3/** — `reportsReducer`, `selectReports`, filtering UI, mount/unmount.
- **shared/** (new on this branch) —
  [`webpackShared.test.js`](../tests/unit/shared/webpackShared.test.js) asserts the
  Option C sharing invariants of all four configs (default scope, `singleton: false`,
  `strictVersion: true`, generation-specific `requiredVersion`, no `shareKey`, no eager,
  fallbacks retained, string remotes, unique `output.uniqueName`) **and** that each build
  resolves `react`/`react-dom` to the generation it declares (the hoisting-leak guard);
  [`runtimeIdentity.test.js`](../tests/unit/shared/runtimeIdentity.test.js) pins the
  semantics of the instance registry the browser evidence relies on.

Unit tests import application source **directly** (through relative paths) and assert the
runtime version reported by `getRuntimeInfo()`: `16.14.0` in the React 16 project,
`19.3.1` in the React 19 project — each project really loads its own generation, which is
itself part of the evidence.

## 2. Integration tests — Playwright against real Module Federation

Config: `tests/integration/playwright.config.js`. Servers: `tests/servers.js`
(four static preview servers over the **production builds**).

```bash
npm run test:integration     # builds all apps, then runs the suite
```

These exercise the **actual Webpack Module Federation runtime in a real browser**
(not mocked remotes), grouped by PRD 7.1 concerns:

- `federation-loading/` — the container loads all three remotes through MF and
  mounts each into its own host element.
- `react-version-resolution/` — the Diagnostics probe reports the **actual** React
  and React DOM each remote resolves at runtime, in the mixed Option C matrix
  (App 1 = 19.3.1, container/App 2/App 3 = 16.14.0), always matching per application,
  always inside the `default` scope, and with **no invalid-hook-call errors**.
- `share-scope-initialization/` (new) — every shipped `remoteEntry.js` registers only
  its own generation and contains no `react16`/`react19` scope names; the host
  initialises React 16 before any remote loads; both generations end up registered in
  the one default scope; each remote also boots standalone with exactly one instance.
- `initialization-order/` (new) — the PRD 6.6 loading sequences: React 19 first,
  React 16 remotes first, six repeated activations, and a full page refresh, each
  re-asserting the versions, the per-app Redux behaviour and "exactly two React
  instances on the page".
- `mount-unmount/` — repeated switching mounts/unmounts cleanly with exactly one
  React root per active remote; no duplicate-root or invalid-hook errors.
- `application-isolation/` — Redux state is isolated per app and per mount
  (remounting App 1 yields a fresh store).

### Why a browser for integration, not jsdom

Module Federation loads each remote's `remoteEntry.js` and shared scope through
the **webpack browser runtime** (JSONP/script loading + `__webpack_share_scopes__`
initialisation). jsdom under Jest cannot faithfully execute that runtime or the
cross-origin script loading. The PRD requires the integration tests to use the
**real MF runtime rather than mocked imports**, so integration runs in Playwright's
Chromium against the production builds. This is the documented fallback anticipated
in the implementation plan; it uses no mocks and still validates MF mechanics at
the framework level, keeping integration distinct from the E2E user-journey suite.

## 3. E2E tests — Playwright full user journeys

Config: `tests/e2e/playwright.config.js`.

```bash
npm run test:e2e             # requires builds; servers started automatically
```

Covers the 12 minimum scenarios from PRD 4.4:

- `navigation.spec.js` — open container, shell displayed, navigate to each MFE,
  switch back and forth several times, verify the previous app is unmounted, and
  assert **no critical console errors or failed requests** (via `tests/helpers.js`
  `watchErrors`).
- `app1.spec.js` / `app2.spec.js` / `app3.spec.js` — each application's Redux-based
  functionality works end-to-end (counter + form + routing; profile save +
  validation; report filtering).
- `mfe-regression.spec.js` — the PRD 7.3 regression matrix (each app loads, renders,
  behaves, no console errors; all three coexist). This suite is behaviour-based and
  is reused **unchanged** as the regression gate on the React 19 branches.
- `react-runtime.spec.js` — the React version executing in the browser is verified
  for the container and every remote (mixed 16/19), the page is asserted to run
  **exactly two React and two React DOM instances** with the correct consumer sets,
  and a full tour asserts **no JS asset is fetched twice** and zero console errors.

### Reading the runtime evidence

Version strings alone cannot prove sharing under `singleton: false` — a silent local
fallback still prints `16.14.0`. The suites therefore also read the page-wide identity
registry that [`shared/runtime-identity.js`](../shared/runtime-identity.js) maintains
(`window.__mfeRuntimeIdentity__`, exposed to tests through
`readPageRuntimes(page)` in `tests/helpers.js`), which reports the **module object** each
application resolved and which applications share it. The Diagnostics page renders the
same data for humans.

## Console / network hygiene

`tests/helpers.js` attaches `console`, `pageerror` and `requestfailed` listeners.
Suites assert zero critical errors and zero failed remote-chunk requests, satisfying
"capture browser console errors during E2E tests" (PRD 11).

## Combined run

```bash
npm run test:all    # unit + integration + e2e
```

## Skipping

No tests are skipped on this branch. Any future skip must be reported with a
documented reason (PRD 11: "report skipped tests and their reasons explicitly").

## Results on this branch (after `npm ci`, production builds, headless Chromium)

| Suite | Result |
| --- | --- |
| `npm run test:unit:legacy` | 50 passed (10 files) |
| `npm run test:unit:app1` | 16 passed (5 files) |
| `npm run test:integration` | 19 passed (6 files) |
| `npm run test:e2e` | 19 passed (6 files) |

Baseline (Part 1) was 34 + 8 + 17 = 59; no baseline test was deleted or weakened. The
only baseline expectations that changed are the two version-matrix suites (now the mixed
16/19 matrix, per PRD 7.3) and `mfe-app-3`'s contract shape (now asserting the added
renderer/scope/identity fields). See
[migration-option-c.md §7](./migration-option-c.md#7-test-results).
