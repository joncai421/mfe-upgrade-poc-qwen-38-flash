# Branching and Migration Guide

This document explains how Part 1 (this `main` baseline) is used as the exact
starting point for the two React 19 migration branches, and the enforced workflow.

## Branch model (PRD 8.1)

```text
main  ──  BASELINE COMMIT (Part 1)
   ├── migration/react19-share-scopes                         (Option B — Part 2)
   └── migration/react19-multi-version-default-scope          (Option C — Part 3)
```

Both migration branches must branch from the **same** baseline commit. Option C must
**not** be based on Option B. Nothing is auto-merged into `main`.

## Baseline commit SHA

Recorded here once the developer commits and pushes `main` (Part 1 gate):

```
BASELINE_COMMIT_SHA = 163dd263517373c80fbabc92eec3e11ba86b0aa1   (main = origin/main, "init")
```

Both `migration/*` branches must be created from this exact SHA. Part 2
(`migration/react19-share-scopes`) was created from it and verified with
`git rev-parse main` before branching; Part 3 must branch from the same SHA and
**not** from the Option B branch. Until a phase is committed by the developer, the
next phase cannot begin — this is a hard human gate (PRD 8.2).

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

> **Part 2 outcome (this branch).** All of the above is implemented and verified;
> the details, measurements and rollback procedure are in
> [docs/migration-option-b.md](migration-option-b.md). One requirement was found
> that the PRD does not mention: a remote must also set the **top-level**
> `shareScope` option of `ModuleFederationPlugin`, not only
> `shared[...].shareScope`, or the host's scope map is never read and every app
> silently falls back to its own React copy (migration-option-b.md §2.1). Part 3
> does not use named scopes, so it is unaffected by that specific pitfall.

## Starting Part 3 (Option C — multi-version default scope)

```bash
git fetch
git checkout -b migration/react19-multi-version-default-scope <BASELINE_COMMIT_SHA>
```

Scope of Part 3 (PRD 6): same React 19 upgrade for App 1, but all four apps stay in
the **default** scope with `singleton: false`, `strictVersion: true` and matching
`requiredVersion`. Part 3 must verify **actual runtime provider selection**
(which React version each consumer resolves), initialisation-order independence and
local fallback behaviour — not just that the config looks right.

## Reverting to a single React 19 singleton (final target, PRD 10.1)

After **all** applications eventually reach React 19, the configuration returns to
the baseline shape but on React 19:

- one default share scope;
- `react` / `react-dom` `singleton: true`, `requiredVersion: "^19.x"`.

This revert is documented only — it is **not** implemented in Parts 1–3.

## What the baseline guarantees for a fair comparison

- The mount/unmount contract is identical on every branch (implemented in Part 1).
- `tests/e2e/mfe-regression.spec.js` encodes the PRD 7.3 regression matrix and is
  intended to run **unchanged** on Option B and Option C, so behaviour is compared,
  not just compilation.
- `docs/performance-baseline.md` is the size reference both branches measure against.
