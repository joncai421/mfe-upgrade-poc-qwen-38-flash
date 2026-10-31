# Branching and Migration Guide

This document explains how the Part 1 baseline is used as the exact starting point for
the two React 19 migration branches, and the enforced workflow. You are reading it on
`migration/react19-multi-version-default-scope` (Part 3, Option C).

## Branch model (PRD 8.1)

```text
main  ──  BASELINE COMMIT 163dd26 (Part 1)
   ├── migration/react19-share-scopes                         (Option B — Part 2)
   └── migration/react19-multi-version-default-scope          (Option C — Part 3)
```

Both migration branches must branch from the **same** baseline commit. Option C must
**not** be based on Option B. Nothing is auto-merged into `main`.

Verified on this branch when the Option C branch was created:

```bash
$ git log -1 --format='%H' migration/react19-multi-version-default-scope
163dd263517373c80fbabc92eec3e11ba86b0aa1
$ git merge-base --is-ancestor migration/react19-share-scopes HEAD || echo "not based on Option B"
not based on Option B
```

## Baseline commit SHA

`main` was committed and pushed by the developer; the recorded baseline is:

```
BASELINE_COMMIT_SHA = 163dd263517373c80fbabc92eec3e11ba86b0aa1  ("init", 2026-10-31)
```

Both `migration/*` branches are created from this exact SHA.

## Human verification gates (PRD 8.5)

| Phase  | Branch                                        | Agent action | Human action | Then |
| ------ | --------------------------------------------- | ------------ | ------------ | ---- |
| Part 1 | `main`                                        | build baseline| verify + push | new session |
| Part 2 | `migration/react19-share-scopes`              | Option B      | verify + push | new session |
| Part 3 | `migration/react19-multi-version-default-scope`| Option C     | verify + push | stop |

The agent must **not**: auto-advance to the next phase, switch branches after a
phase, push, merge, or assume verification happened.

## Starting Part 2 (Option B — separate share scopes)

```bash
git fetch
git checkout -b migration/react19-share-scopes <BASELINE_COMMIT_SHA>
```

Scope of Option B (PRD 5):

- Upgrade **only** `mfe-app-1` to React 19; container + App 2 + App 3 stay on 16.14.0.
- Two share scopes: `react16` (container, App 2, App 3) and `react19` (App 1), each
  with `singleton: true` + `strictVersion: true`.
- The host's `remotes` initialise each remote in the correct scope.

The baseline was designed so this needs **no change to the mount contract**: the
container consumes only `mount`/`unmount`, and each remote already owns its own
React root. The `react/` and `react-dom/` subpath-sharing entries in
`shared/webpack.base.js` exist precisely so `react/jsx-runtime` and `react-dom/client`
resolve correctly once App 1 moves to React 19.

React 19 code changes required in App 1 (PRD 5.4): replace `ReactDOM.render`/
`unmountComponentAtNode` with `createRoot`/`root.unmount()` (isolated inside
`shared/mount-contract.js` usage — App 1 will bind a React-19 variant while the
other apps keep the React-16 variant), adopt the automatic JSX runtime, move `act`
imports to `react`, and drop function-component `propTypes`/`defaultProps`.

## Starting Part 3 (Option C — multi-version default scope) — **implemented**

```bash
git fetch
git checkout -b migration/react19-multi-version-default-scope 163dd263517373c80fbabc92eec3e11ba86b0aa1
```

Scope of Part 3 (PRD 6): the same React 19 upgrade for App 1, but all four apps stay in
the **default** scope with `singleton: false`, `strictVersion: true` and generation-specific
`requiredVersion`. What the implementation had to establish beyond the config:

- **Actual provider selection** — verified by module-object identity per application
  (`shared/runtime-identity.js` + the Diagnostics page), not by version string, because a
  silent local fallback under `singleton: false` still reports `16.14.0`.
- **Initialisation-order independence** — `tests/integration/initialization-order/` runs the
  PRD's sequences; `share-scope-initialization/` covers concurrent and standalone starts.
- **Local fallback behaviour** — retained and exercised by the standalone remote pages.
- **A hoisting/registration hazard** specific to an npm-workspaces monorepo, found and fixed
  (root React 16 leaking into the React 19 build) — see
  [migration-option-c.md 6.2](./migration-option-c.md#62-npm-workspaces-hoisting-can-leak-the-other-generation-into-a-build-found-and-fixed).

Full write-up, measurements, limitations and rollback:
[migration-option-c.md](./migration-option-c.md).

## Reverting to a single React 19 singleton (final target, PRD 10.1)

After **all** applications eventually reach React 19, the configuration returns to
the baseline shape but on React 19:

- one default share scope;
- `react` / `react-dom` `singleton: true`, `requiredVersion: "^19.x"`.

This revert is documented only — it is **not** implemented in Parts 1–3. Option C's
step-by-step rollback list is
[migration-option-c.md §10](./migration-option-c.md#10-reverting-to-the-intended-final-architecture).

## What the baseline guarantees for a fair comparison

- The mount/unmount contract is identical on every branch (implemented in Part 1). On
  Option C the contract grew a second factory for `createRoot`, but the public handle
  (`mount` → `{ unmount, isMounted, getRuntimeInfo }`) is unchanged and the container code
  is the same for both generations.
- `tests/e2e/mfe-regression.spec.js` encodes the PRD 7.3 regression matrix and runs
  **unchanged** on Option B and Option C, so behaviour is compared, not just compilation.
- `docs/performance-baseline.md` is the size reference both branches measure against. It is
  never overwritten by a migration branch: `scripts/collect-build-stats.js` derives its
  output document from the sharing configuration it finds (Option C writes
  `docs/performance-option-c.md` + `docs/performance-option-c-runtime.md`).
- Both branches share `tests/expectations.js` as the single source of truth for the version
  matrix their browser suites assert.
