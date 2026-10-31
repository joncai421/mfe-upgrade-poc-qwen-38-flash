# ADR-001: Micro-Frontend Architecture and Mount Contract

- **Status:** Accepted
- **Date:** 2026-10-31
- **Phase:** Part 1 (baseline, `main`); re-verified by Part 3 (Option C)

## Context

We need a reference Webpack 5 Module Federation system — one container plus three
independently built React micro-frontends — that can later demonstrate a gradual
React 16 → React 19 upgrade of a single remote while the rest stay on React 16.
The critical requirement (PRD 2.2) is that React 16 and React 19 applications
coexist on one page **without** mixing React runtimes inside a single component
tree, and without a React Bridge dependency.

## Decision

1. **npm workspaces monorepo**, four independently buildable apps sharing a
   `shared/` webpack/MF config factory, the mount contract and Tailwind base.
2. **Framework-independent mount/unmount contract** as the only integration seam:
   each remote exposes `./App` → `mount.js` exporting `mount(element, props)` and
   `unmount()`. `mount()` returns a handle with `unmount()` and `getRuntimeInfo()`.
3. **Each remote owns its own React root.** The container renders only a placeholder
   `<div>` and imperatively calls `mount`/`unmount` from `RemoteSection` lifecycle
   methods. No remote React element, hook, or context crosses into the container tree.
4. **No React Bridge** (`@module-federation/bridge-react`) is used.
5. **Remote URLs are centralised** in `.env` and injected via `DefinePlugin`; module
   aliases stay stable so application code never hardcodes URLs.
6. **Container uses memory history** and App 1 uses `MemoryRouter`, decoupling each
   app's routing and keeping the container bundle runnable in a headless DOM.

## Consequences

- **Positive:** the container is React-version agnostic — it only consumes
  `mount`/`unmount`. This is what lets Part 2/3 upgrade one remote to React 19 with
  **zero container changes** and **no change to the contract**.
- **Positive:** repeated, independent mount/unmount and per-mount Redux isolation
  are naturally satisfied because each `mount()` creates a fresh store/root.
- **Trade-off:** cross-app communication cannot use React context/props; it must go
  through framework-independent channels. This is intentional and enforced by the
  architecture, matching PRD constraints 2–4.
- **Trade-off:** during the migration window more than one React runtime is loaded
  (measured in the performance docs); this is the cost being studied, not a defect.

## Part 3 verification (Option C, React 19 in the default scope)

The integration seam held. Mounting a React 19 remote required **no change to the container's
orchestration code** (`RemoteSection` still calls `remote.load()` → `mod.mount(element, props)` →
`handle.unmount()`), and **no React Bridge** was introduced. App 1's upgrade is confined to its own
workspace plus one descriptor in the shared webpack factory.

Two honest qualifications to the "no change to the contract" claim, both additive:

1. `shared/mount-contract.js` gained a second **factory** (`createRootMountContract`) because React
   19 removed `ReactDOM.render`. The **interface** — `mount(element, props)` returning
   `{ unmount, isMounted, getRuntimeInfo }` — is unchanged, and the React 16 apps keep calling the
   original factory with no code change.
2. `getRuntimeInfo()` grew `renderer`, `shareScope` and `identity` fields, and the container's
   Diagnostics page/bootstrap were extended to display and to register them. PRD 5.5/6.6 demands
   verification of the *actual* runtime per application, and under `singleton: false` a version
   string alone is not sufficient evidence — module-object identity is
   ([migration-option-c.md §4](../migration-option-c.md#4-shared-dependency-resolution--verification)).
   Existing consumers of the earlier two-field shape are unaffected: the additions are additive.

The "more than one React runtime during migration" trade-off was measured rather than assumed:
two React and two React DOM instances on the page, each downloaded exactly once
([performance-option-c-runtime.md](../performance-option-c-runtime.md)).

## Alternatives considered

- **React Bridge / shared component tree:** rejected — explicitly out of scope and
  would couple remotes to the container's React version.
- **Passing remote React components into the container's tree:** rejected — violates
  the no-cross-version-tree rule and would break when a remote upgrades.
- **Single CRA-based app:** rejected — the project's purpose is direct Webpack 5
  Module Federation (PRD 3.1 forbids react-scripts as a substitute).
