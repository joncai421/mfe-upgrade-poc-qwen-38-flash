# ADR-001: Micro-Frontend Architecture and Mount Contract

- **Status:** Accepted
- **Date:** 2026-10-31
- **Phase:** Part 1 (baseline, `main`)

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

## Alternatives considered

- **React Bridge / shared component tree:** rejected — explicitly out of scope and
  would couple remotes to the container's React version.
- **Passing remote React components into the container's tree:** rejected — violates
  the no-cross-version-tree rule and would break when a remote upgrades.
- **Single CRA-based app:** rejected — the project's purpose is direct Webpack 5
  Module Federation (PRD 3.1 forbids react-scripts as a substitute).
