# Module Federation Guide

This document explains the exact federation configuration used on **this branch
(Option C)** and the reasoning behind each choice. The Part 1 baseline configuration is
still in git history on `main`; only the shared descriptor changed.

## Shared configuration factory

All four `webpack.config.js` files call `createConfig()` from
[`shared/webpack.base.js`](../shared/webpack.base.js). Each app passes its own `name`,
`port`, `filename`, `remotes`/`exposes` **and the React generation it builds against**,
so the sharing contract stays generated from one place:

```js
new ModuleFederationPlugin({
  name,                 // containerApp | mfeApp1 | mfeApp2 | mfeApp3
  filename,             // remoteEntry.js for remotes (undefined for the host)
  remotes,              // host only
  exposes,              // remotes only: { "./App": "./src/mount.js" }
  // no shareScope option => the "default" scope
  shared,               // SHARED_REACT_16 or SHARED_REACT_19, by reactVersion
});
```

## Option C shared config (PRD 6.3)

```js
// React 16 builds: container-app, mfe-app-2, mfe-app-3
const SHARED_REACT_16 = {
  react:       { singleton: false, requiredVersion: "^16.14.0", strictVersion: true, version: "16.14.0" },
  "react-dom": { singleton: false, requiredVersion: "^16.14.0", strictVersion: true, version: "16.14.0" },
  "react/":    { singleton: false, requiredVersion: "^16.14.0", strictVersion: true, version: "16.14.0" },
  "react-dom/":{ singleton: false, requiredVersion: "^16.14.0", strictVersion: true, version: "16.14.0" },
};
// React 19 build: mfe-app-1 — same shape with ^19.3.1 / 19.3.1
```

- **One scope for everything.** No `shareScope` key at plugin level or per dependency, and
  the host's remotes stay plain strings, so providers and consumers all use webpack's
  `default` scope. Option B's named scopes are deliberately not used here.
- **`singleton: false`** — permits both generations to be registered under one key.
- **`requiredVersion` is the separator** — `^16.14.0` can never select `19.3.1` and vice
  versa. This, not a scope name, is what keeps the generations apart.
- **`strictVersion: true`** — an unsatisfiable requirement fails loudly instead of quietly
  consuming a wrong-generation provider.
- **`version` is pinned** — decides what the build *offers* to the scope, independent of
  where npm hoisted a copy (see the leak in
  [migration-option-c.md 6.2](./migration-option-c.md#62-npm-workspaces-hoisting-can-leak-the-other-generation-into-a-build-found-and-fixed)).
- **`react/` and `react-dom/` trailing-slash entries** — package roots and subpath imports
  (`react/jsx-runtime`, `react-dom/client`) negotiate identically, so one application can
  never mix generations internally.
- **No `eager`, no custom `shareKey`, fallbacks retained.**

## Generation pinning via `resolve.alias`

`createConfig()` also sets, per build:

```js
resolve: { alias: reactAliasFor(dir) } // react / react-dom -> the package root THIS build resolves
```

npm workspaces hoist packages every workspace agrees on (`react-router-dom`,
`use-sync-external-store`), and those live in the repo root, where their own
`require("react")` resolves to React 16 — even inside the React 19 compilation. Aliasing
pins the generation without changing the request text, so Module Federation still matches
the request as a shared consume (webpack matches module requests **unresolved**). Without
it, App 1's build registered the root React 16 file into the default scope as
`react@19.3.1`.

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

Option C needs **no** change here: the string form initialises the default scope. (Option
B instead switches to the object form `{ external, shareScope }`.)

## `output` requirements

- **`uniqueName`** is set per build (`containerApp`, `mfeApp1`, …) so the webpack
  runtimes never collide on the page. It also matters for sharing: when two builds offer
  the **same** version of a package, webpack's registration rule uses `uniqueName` to pick
  the winner (see [migration-option-c.md 6.3](./migration-option-c.md#63-a-same-version-provider-is-still-a-single-winner)).
- **`publicPath: "auto"`** lets each remote resolve its own chunk URLs relative to
  where `remoteEntry.js` was loaded from — required because the container fetches
  remote chunks cross-origin.
- **No `eager: true`** is used (PRD 11) — remotes are loaded on demand.
- **Local fallbacks are retained** — `shared` entries do not set `import: false` or
  `fallback: false`, so each app can still resolve its own React if no compatible
  provider is available. The builds show this explicitly:
  `consume shared module (default) react@^19.3.1 (strict) (fallback: ./node_modules/react/index.js)`.
  Standalone pages prove the fallback works; `strictVersion: true` means an
  *unsatisfiable* version requirement raises rather than silently using it.

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
majors to coexist on one page. `shared/mount-contract.js` provides one factory per
generation — `createMountContract` (React 16, `ReactDOM.render`) and
`createRootMountContract` (React 19, `createRoot`) — that return the **same** handle, so
the container code is identical for both.

## Dev-server CORS

`shared/webpack.base.js` sets `devServer.headers["Access-Control-Allow-Origin"] = "*"`
so the host (different origin) can fetch `remoteEntry.js` and chunks during
development. Production **preview** uses `serve`, which enables CORS by default;
Module Federation loads remote entries/chunks via `<script>` tags, which are
CORS-free.

## Verified at runtime (PRD 11: do not trust the config alone)

Three independent channels, all reproducible:

1. `tests/unit/shared/webpackShared.test.js` — the configuration invariants.
2. `tests/integration/share-scope-initialization` + `react-version-resolution` and the E2E
   `react-runtime` suite — the **actual** React/React DOM version *and* the identity of the
   module object each application resolved (mixed matrix: App 1 `19.3.1`, the three React 16
   applications sharing one `16.14.0` instance).
3. `npm run perf:measure` — the browser's own network log: which assets were fetched, how
   many times, and which generation each one carries
   ([performance-option-c-runtime.md](./performance-option-c-runtime.md)).
