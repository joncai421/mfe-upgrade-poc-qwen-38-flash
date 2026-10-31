# Architecture

> Branch: `migration/react19-multi-version-default-scope` (Option C, Part 3). The Part 1
> baseline on `main` shares a single React 16 runtime; on this branch **two React
> generations coexist inside the one default share scope**.

## Overview

The system is a host/container plus three independently built micro-frontends that share
their React runtimes through Webpack 5 Module Federation. App 1 renders with React 19.3.1;
the container, App 2 and App 3 still render with React 16.14.0. All four register and
consume in the **same** `default` scope, and each application negotiates the version its
`requiredVersion` allows.

```mermaid
graph TD
    Browser[Browser page]
    subgraph Host["container-app :3000 (React 16)"]
        Shell[App shell + navigation]
        RS[RemoteSection<br/>imperative mount/unmount]
        Diag[Diagnostics<br/>runtime version + instance identity probe]
    end
    subgraph R1["mfe-app-1 :3001 (React 19)"]
        E1["remoteEntry.js -> ./App (mount contract via createRoot)"]
    end
    subgraph R2["mfe-app-2 :3002 (React 16)"]
        E2["remoteEntry.js -> ./App"]
    end
    subgraph R3["mfe-app-3 :3003 (React 16)"]
        E3["remoteEntry.js -> ./App"]
    end

    Browser --> Host
    Shell --> RS
    Shell --> Diag
    RS -->|import("mfeApp1/App") via MF runtime| E1
    RS -->|import("mfeApp2/App")| E2
    RS -->|import("mfeApp3/App")| E3

    SS[("Shared scope 'default'<br/>react + react-dom@16.14.0 AND @19.3.1<br/>singleton: false, strictVersion: true")]
    Host -."provides/consumes ^16.14.0".-> SS
    R1 -."provides/consumes ^19.3.1".-> SS
    R2 -."consumes ^16.14.0".-> SS
    R3 -."consumes ^16.14.0".-> SS
```

## The mount/unmount contract (critical constraint)

Every micro-frontend exposes `./App` → `src/mount.js`, which follows a
framework-independent contract defined in
[`shared/mount-contract.js`](../shared/mount-contract.js):

```js
const handle = mount(element, props);   // creates a private React root in `element`
handle.unmount();                        // React 16: unmountComponentAtNode / React 19: root.unmount()
handle.getRuntimeInfo();
// { reactVersion, reactDomVersion, renderer, shareScope,
//   identity: { react: {id, version, consumers}, reactDom: {...} } }
```

Two factories implement it in [`shared/mount-contract.js`](../shared/mount-contract.js) —
`createMountContract` (React 16, `ReactDOM.render`) and `createRootMountContract` (React 19,
`createRoot`) — and return the **same handle shape**, which is why the container code does not
care which generation a remote uses.

This design enforces the PRD's architectural rules:

1. **Each MFE has its own React root.** `mount()` calls `ReactDOM.render()` into
   the container-supplied element. Roots never overlap.
2. **No React components cross application boundaries.** The container renders a
   plain placeholder `<div>` (`RemoteSection`) and imperatively calls `mount()` /
   `unmount()` in component lifecycle methods. No remote element, hook, or context
   is ever passed into the container's React tree.
3. **Applications communicate through framework-independent interfaces** — the
   mount contract and `getRuntimeInfo()` diagnostics.
4. **The container does not know which React version a remote uses.** It only
   consumes the `mount`/`unmount` interface. This is what lets Part 2/3 upgrade a
   single remote to React 19 without changing the container.
5. **No React Bridge dependency** is introduced.

Because each `mount()` returns a handle that owns its own container element, the
same exposed module can be mounted in more than one place (for example the
diagnostics probe and the active view) and unmounted independently and repeatedly.

## Per-application state isolation

Each remote creates its **own Redux store inside `mount()`** (see each app's
`src/mount.js`). Mounting always yields a fresh store, so:

- state is isolated per application **and** per mount;
- switching away and back resets that application's state (verified by the
  `application-isolation` integration tests);
- there is no cross-application state management (explicitly out of scope).

## Routing without coupling

- The **container** uses `react-router-dom` `Router` with a `createMemoryHistory()`
  instance, so its bundle has no dependency on a browser `window.history`/hash URL
  and can also execute inside a headless DOM during integration testing.
- **App 1** uses `MemoryRouter` for its own local Home/Details routes, so remote
  routing never interferes with the container's memory history.

## Shared dependency strategy (Option C)

All four builds share `react` and `react-dom` from the **default** share scope, with
`singleton: false` so two versions may be registered, `strictVersion: true` so a
requirement that cannot be satisfied fails loudly, a generation-specific
`requiredVersion`, and a pinned `version` so each build's offer is deterministic:

```js
// React 16 builds (container, App 2, App 3) — React 19 build (App 1) uses ^19.3.1 / 19.3.1
shared: {
  react:     { singleton: false, requiredVersion: "^16.14.0", strictVersion: true, version: "16.14.0" },
  "react-dom": { singleton: false, requiredVersion: "^16.14.0", strictVersion: true, version: "16.14.0" },
  "react/":    { singleton: false, requiredVersion: "^16.14.0", strictVersion: true, version: "16.14.0" },
  "react-dom/":{ singleton: false, requiredVersion: "^16.14.0", strictVersion: true, version: "16.14.0" },
}
```

The trailing-slash subpath entries (`react/`, `react-dom/`) keep `react/jsx-runtime` and
`react-dom/client` negotiating to the same generation as their package root, which is what
makes App 1's React 19 renderer and JSX runtime resolve together.

No `shareScope` names and no custom `shareKey` values are used — that is the difference from
Option B. The **semver constraint, not the scope name, is the separator**; see
[migration-option-c.md](migration-option-c.md) for how the resulting provider selection was
verified at runtime, and [module-federation-guide.md](module-federation-guide.md) for the
configuration detail.
