# Application Structure

## Monorepo layout

The repository uses **npm workspaces**. A shared `shared/` directory holds the
common Webpack/MF configuration factory, the mount-contract factory, and the
Tailwind base stylesheet. Each application remains an independently buildable,
independently runnable package with its own `webpack.config.js`.

```text
.
├── container-app/            # Host shell (port 3000)
│   ├── public/index.html
│   ├── src/
│   │   ├── index.js          # async boundary -> import("./bootstrap")
│   │   ├── bootstrap.js      # ReactDOM.render of the container App
│   │   ├── App.jsx           # Router (memory history), navigation, routes
│   │   ├── remotes/registry.js   # central remote metadata + load() fns
│   │   └── components/
│   │       ├── Navigation.jsx
│   │       ├── RemoteSection.jsx  # imperative mount/unmount of a remote
│   │       └── Diagnostics.jsx    # runtime version probe
│   ├── package.json
│   └── webpack.config.js
├── mfe-app-1/                # Remote: counter + form + local routes (port 3001)
│   ├── public/index.html
│   ├── src/
│   │   ├── index.js / bootstrap.js        # standalone entry
│   │   ├── mount.js                       # exposes { mount, unmount }
│   │   ├── App.jsx                        # MemoryRouter + Home/Details
│   │   ├── pages/{HomePage,DetailsPage}.jsx
│   │   ├── components/{Counter,ContactForm}.jsx
│   │   ├── redux/{actions,counterReducer,store}.js
│   │   └── utils/validation.js
│   ├── package.json
│   └── webpack.config.js
├── mfe-app-2/                # Remote: profile management (port 3002)
│   └── src/... {redux/actions,profileReducer,store}, utils/validation,
│            components/ProfileForm, mount.js, App.jsx
├── mfe-app-3/                # Remote: report filtering (port 3003)
│   └── src/... {redux/actions,reportsReducer,selectors,store}, data/reports,
│            components/{ReportFilter,ReportList}, mount.js, App.jsx
├── shared/
│   ├── webpack.base.js       # createConfig() + SHARED_REACT_BASELINE
│   ├── mount-contract.js     # createMountContract()
│   └── styles/base.css       # Tailwind directives + component classes
├── scripts/collect-build-stats.js
├── tests/
│   ├── helpers.js            # console/network error capture for Playwright
│   ├── servers.js            # shared webServer definitions for Playwright
│   ├── jest.setup.js         # jest-dom matchers
│   ├── __mocks__/styleMock.js
│   ├── unit/{container,mfe-app-1,mfe-app-2,mfe-app-3}/*.test.js
│   ├── integration/{federation-loading,react-version-resolution,mount-unmount,application-isolation}/*.spec.js
│   └── e2e/*.spec.js
├── docs/
├── babel.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env / .env.example       # remote URLs (not hardcoded in app code)
├── package.json              # workspaces + orchestration scripts
└── .github/workflows/ci.yml
```

## What each application exposes / consumes

| Application   | MF role    | exposes               | consumes (shared) | own Redux state |
| ------------- | ---------- | --------------------- | ----------------- | --------------- |
| container-app | host       | (none)                | react, react-dom  | (none — shell)  |
| mfe-app-1     | remote     | `./App` (mount.js)    | react, react-dom  | `counter`       |
| mfe-app-2     | remote     | `./App` (mount.js)    | react, react-dom  | `profile`       |
| mfe-app-3     | remote     | `./App` (mount.js)    | react, react-dom  | `reports`       |

## The `src/index.js` async boundary

Every application's entry is a one-line `import("./bootstrap")`. Module
Federation needs this asynchronous boundary so the shared module scope is fully
initialised before any `react`/`react-dom` import is evaluated. The synchronous
entry must never import React directly.
