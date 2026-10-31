# Application Structure

> Branch: `migration/react19-multi-version-default-scope` (Option C). The structure is the
> Part 1 layout plus a React 19 workspace (`mfe-app-1`), a runtime-identity probe and the
> test/measurement tooling the migration evidence needs.

## Monorepo layout

The repository uses **npm workspaces**. A shared `shared/` directory holds the
common Webpack/MF configuration factory, the mount-contract factories, the runtime
identity probe, and the Tailwind base stylesheet. Each application remains an
independently buildable, independently runnable package with its own
`webpack.config.js`.

```text
.
├── container-app/            # Host shell (port 3000, React 16.14.0)
│   ├── public/index.html
│   ├── src/
│   │   ├── index.js          # async boundary -> import("./bootstrap")
│   │   ├── bootstrap.js      # ReactDOM.render + registers the container in the runtime census
│   │   ├── App.jsx           # Router (memory history), navigation, routes
│   │   ├── remotes/registry.js   # central remote metadata + load() fns
│   │   └── components/
│   │       ├── Navigation.jsx
│   │       ├── RemoteSection.jsx  # imperative mount/unmount of a remote
│   │       └── Diagnostics.jsx    # runtime version + instance-identity probe
│   ├── package.json
│   └── webpack.config.js     # createConfig({ ..., reactVersion: REACT_16_VERSION })
├── mfe-app-1/                # Remote: counter + form + local routes (port 3001, React 19.3.1)
│   ├── public/index.html
│   ├── babel.config.js       # automatic JSX runtime (overrides the root classic config)
│   ├── src/
│   │   ├── index.js / bootstrap.js        # standalone entry
│   │   ├── mount.js                       # exposes { mount, unmount } via createRoot
│   │   ├── App.jsx                        # MemoryRouter + Home/Details
│   │   ├── pages/{HomePage,DetailsPage}.jsx
│   │   ├── components/{Counter,ContactForm}.jsx
│   │   ├── redux/{actions,counterReducer,store}.js
│   │   └── utils/validation.js
│   ├── package.json          # react/react-dom 19.3.1, redux 5, react-redux 9 + Jest 30 devDeps
│   └── webpack.config.js     # createConfig({ ..., reactVersion: REACT_19_VERSION })
├── mfe-app-2/                # Remote: profile management (port 3002, React 16.14.0)
│   └── src/... {redux/actions,profileReducer,store}, utils/validation,
│            components/ProfileForm, mount.js, App.jsx
├── mfe-app-3/                # Remote: report filtering (port 3003, React 16.14.0)
│   └── src/... {redux/actions,reportsReducer,selectors,store}, data/reports,
│            components/{ReportFilter,ReportList}, mount.js, App.jsx
├── shared/
│   ├── webpack.base.js       # createConfig() + SHARED_REACT_16 / SHARED_REACT_19 + alias pinning
│   ├── mount-contract.js     # createMountContract() (16) + createRootMountContract() (19)
│   ├── runtime-identity.js   # page-wide module-identity registry (sharing evidence)
│   └── styles/base.css       # Tailwind directives + component classes
├── scripts/
│   ├── collect-build-stats.js   # build stats -> doc chosen by the branch's sharing mode
│   └── measure-runtime.js       # drives the real page -> docs/performance-option-c-runtime.md
├── tests/
│   ├── expectations.js       # PRD 6.2 version matrix (one source of truth for browsers)
│   ├── helpers.js            # console/network capture + readPageRuntimes + JS timings
│   ├── servers.js            # shared webServer definitions for Playwright
│   ├── jest.setup.js         # jest-dom 5 matchers (React 16 project)
│   ├── jest.setup.app1.js    # jest-dom 6 matchers (React 19 project)
│   ├── __mocks__/styleMock.js
│   ├── unit/
│   │   ├── jest.config.js       # React 16 project (Jest 26)
│   │   ├── jest.app1.config.js  # React 19 project (Jest 30, rootDir = mfe-app-1)
│   │   ├── container/  mfe-app-2/  mfe-app-3/  shared/  mfe-app-1/
│   ├── integration/{federation-loading,react-version-resolution,share-scope-initialization,
│   │                initialization-order,mount-unmount,application-isolation}/*.spec.js
│   └── e2e/*.spec.js
├── docs/
├── babel.config.js           # root (classic JSX runtime) for the React 16 workspaces
├── tailwind.config.js
├── postcss.config.js
├── .env / .env.example       # remote URLs (not hardcoded in app code)
├── package.json              # workspaces + orchestration scripts
└── .github/workflows/ci.yml
```

## What each application exposes / consumes

| Application   | MF role | React | exposes | consumes (shared)                       | own Redux state |
| ------------- | ------- | ----- | ------- | --------------------------------------- | --------------- |
| container-app | host    | 16.14.0 | (none)                                           | react, react-dom, react/, react-dom/    | (none — shell)  |
| mfe-app-1     | remote  | **19.3.1** | `./App` (mount.js)                            | same keys, `^19.3.1`                    | `counter`       |
| mfe-app-2     | remote  | 16.14.0 | `./App` (mount.js)                                 | same keys, `^16.14.0`                   | `profile`       |
| mfe-app-3     | remote  | 16.14.0 | `./App` (mount.js)                                 | same keys, `^16.14.0`                   | `reports`       |

All four register and consume in the **same `default` scope** — that is Option C. Each
application still owns its own React root, its own Redux store and its own mount contract.

## The `src/index.js` async boundary

Every application's entry is a one-line `import("./bootstrap")`. Module
Federation needs this asynchronous boundary so the shared module scope is fully
initialised before any `react`/`react-dom` import is evaluated. The synchronous
entry must never import React directly.
