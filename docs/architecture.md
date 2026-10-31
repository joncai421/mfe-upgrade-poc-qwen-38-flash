# Architecture

## Overview

The system is a host/container plus three independently built micro-frontends that
share one React runtime through Webpack 5 Module Federation.

```mermaid
graph TD
    Browser[Browser page]
    subgraph Host["container-app :3000 (React 16)"]
        Shell[App shell + navigation]
        RS[RemoteSection<br/>imperative mount/unmount]
        Diag[Diagnostics<br/>runtime version probe]
    end
    subgraph R1["mfe-app-1 :3001 (React 16)"]
        E1["remoteEntry.js -> ./App (mount contract)"]
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

    SS[("Shared scope 'default'<br/>react + react-dom 16.14.0<br/>singleton: true")]
    Host -.provides/consumes.-> SS
    R1 -.consumes.-> SS
    R2 -.consumes.-> SS
    R3 -.consumes.-> SS
```

## The mount/unmount contract (critical constraint)

Every micro-frontend exposes `./App` → `src/mount.js`, which follows a
framework-independent contract defined in
[`shared/mount-contract.js`](../shared/mount-contract.js):

```js
const handle = mount(element, props);   // creates a private React 16 root in `element`
handle.unmount();                        // ReactDOM.unmountComponentAtNode(element)
handle.getRuntimeInfo();                 // { reactVersion, reactDomVersion }
```

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

## Shared dependency strategy (baseline)

All four builds share `react` and `react-dom` from the **default** share scope with
`singleton: true` and `requiredVersion: "^16.14.0"`:

```js
shared: {
  react:     { singleton: true, requiredVersion: "^16.14.0" },
  "react-dom": { singleton: true, requiredVersion: "^16.14.0" },
  "react/":    { singleton: true, requiredVersion: "^16.14.0" },
  "react-dom/":{ singleton: true, requiredVersion: "^16.14.0" },
}
```

The trailing-slash subpath entries (`react/`, `react-dom/`) are configured so the
same sharing contract remains correct for the React 19 phase (`react/jsx-runtime`,
`react-dom/client`). See [module-federation-guide.md](module-federation-guide.md).
