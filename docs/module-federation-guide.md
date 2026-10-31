# Module Federation Guide

This document explains the exact federation configuration used by the baseline and
the reasoning behind each choice, so the Part 2/3 branches can extend it safely.

## Shared configuration factory

All four `webpack.config.js` files call `createConfig()` from
[`shared/webpack.base.js`](../shared/webpack.base.js). This guarantees the sharing
contract is **identical across the container and all three MFEs**, while each app
passes its own `name`, `port`, `filename`, `remotes` and `exposes`.

```js
new ModuleFederationPlugin({
  name,                 // containerApp | mfeApp1 | mfeApp2 | mfeApp3
  filename,             // remoteEntry.js for remotes (undefined for the host)
  remotes,              // host only
  exposes,              // remotes only: { "./App": "./src/mount.js" }
  shared: SHARED_REACT_BASELINE,
});
```

## Baseline shared config (PRD 4.2)

```js
const SHARED_REACT_BASELINE = {
  react:      { singleton: true, requiredVersion: "^16.14.0" },
  "react-dom":{ singleton: true, requiredVersion: "^16.14.0" },
  // Subpath sharing (trailing-slash syntax). React 16 + classic JSX runtime does
  // not import react/jsx-runtime today, but declaring these keeps the contract
  // correct for the React 19 phase (react/jsx-runtime, react-dom/client) without
  // changing baseline behaviour.
  "react/":   { singleton: true, requiredVersion: "^16.14.0" },
  "react-dom/":{ singleton: true, requiredVersion: "^16.14.0" },
};
```

- **`singleton: true`** — exactly one React 16.14.0 instance is used on the page.
- **`requiredVersion: "^16.14.0"`** — providers/consumers negotiate within 16.14.x.
- The **`react/` and `react-dom/` trailing-slash entries** enable package subpath
  sharing per PRD 4.2/11.

## Host remotes and centralised URLs

`container-app/webpack.config.js`:

```js
const remotes = {
  mfeApp1: `mfeApp1@${process.env.REMOTE_APP1_URL}`,
  mfeApp2: `mfeApp2@${process.env.REMOTE_APP2_URL}`,
  mfeApp3: `mfeApp3@${process.env.REMOTE_APP3_URL}`,
};
```

URLs come from `.env` (injected by `DefinePlugin`); aliases stay stable. The app
code only ever writes `import("mfeApp1/App")`, so a URL/host change never touches
application code (PRD 11: "avoid hardcoding remote URLs").

## `output` requirements

- **`uniqueName`** is set per build (`containerApp`, `mfeApp1`, …) so the webpack
  runtimes never collide on the page.
- **`publicPath: "auto"`** lets each remote resolve its own chunk URLs relative to
  where `remoteEntry.js` was loaded from — required because the container fetches
  remote chunks cross-origin.
- **No `eager: true`** is used (PRD 11) — remotes are loaded on demand.
- **Local fallbacks are retained** — `shared` entries do not set
  `import: false`, so each app can still resolve its own React if no compatible
  provider is available. This matters most for the Option B/C branches.

## The async boundary

Every app's `src/index.js` is `import("./bootstrap")`. Without this the shared
scope would not be initialised before React is imported, producing the classic
`Shared module is not available for eager consumption` error.

## How remotes are consumed (mount contract, not component tree)

The host's `RemoteSection` does:

```js
const mod = await remote.load();          // resolves the exposed { mount } module
const handle = mod.mount(domNode, props); // remote renders into its OWN React root
// on unmount:
handle.unmount();
```

The host renders only a placeholder `<div>` around the remote's DOM node. No remote
React element ever enters the host's React tree, which is what allows different React
majors to coexist on one page (Part 2/3).

## Dev-server CORS

`shared/webpack.base.js` sets `devServer.headers["Access-Control-Allow-Origin"] = "*"`
so the host (different origin) can fetch `remoteEntry.js` and chunks during
development. Production **preview** uses `serve`, which enables CORS by default;
Module Federation loads remote entries/chunks via `<script>` tags, which are
CORS-free.

## Verified at runtime (PRD 11: do not trust the config alone)

The integration `react-version-resolution` suite and the E2E `react-runtime` suite
both assert that **the actual React/React DOM version executing in the browser** is
`16.14.0` for the container and every remote — read from `getRuntimeInfo()`, not
from `package.json`.
