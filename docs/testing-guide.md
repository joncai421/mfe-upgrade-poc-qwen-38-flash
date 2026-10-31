# Testing Guide

The project has **three testing levels**, all runnable locally and all wired into
CI (`.github/workflows/ci.yml`) in this order: install → lint → unit → build →
integration → e2e.

## 1. Unit tests — Jest 26 + React Testing Library 11

Config: `tests/unit/jest.config.js` (jsdom environment, `babel-jest` transform, CSS
mocked via `tests/__mocks__/styleMock.js`, jest-dom matchers via
`tests/jest.setup.js`).

```bash
npm run test:unit            # all four apps
npm run test:unit:container  # just the container
npm run test:unit:app1       # just App 1 (also :app2 :app3)
npm run test:coverage        # unit coverage report
```

Coverage per PRD 4.4:

- **container/** — remote registry shape; `RemoteSection` load→mount→runtime-info→
  unmount orchestration and error handling (via a fake remote module, so the
  container's own logic is tested without the browser).
- **mfe-app-1/** — `counterReducer`, `validateContact`, `Counter` interactions,
  `ContactForm` validation/submit, local routing, and the mount/unmount contract.
- **mfe-app-2/** — `profileReducer`, `validateProfile`, `ProfileForm` save +
  validation, mount/unmount contract.
- **mfe-app-3/** — `reportsReducer`, `selectReports`, filtering UI, mount/unmount.

Unit tests import application source **directly** (through relative paths) and
assert the runtime version reported by `getRuntimeInfo()` is `16.14.0`.

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
  and React DOM each remote resolves at runtime (`16.14.0`), matching together.
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
  is designed to be reused **unchanged** as the regression gate on the React 19
  branches.
- `react-runtime.spec.js` — the React version executing in the browser is verified
  for the container and every remote.

## Console / network hygiene

`tests/helpers.js` attaches `console`, `pageerror` and `requestfailed` listeners.
Suites assert zero critical errors and zero failed remote-chunk requests, satisfying
"capture browser console errors during E2E tests" (PRD 11).

## Combined run

```bash
npm run test:all    # unit + integration + e2e
```

## Skipping

No tests are skipped in this baseline. Any future skip must be reported with a
documented reason (PRD 11: "report skipped tests and their reasons explicitly").
