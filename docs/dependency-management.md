# Dependency Management

All versions are **pinned** (exact or caret within one major) and committed in
`package-lock.json`. Install reproducibly with `npm ci`.

This is a deliberately **React-16-era reference scaffold** for evaluating a
migration. It is **not** a production dependency recommendation. See
[Legacy & security status](#legacy--security-status).

> **Branch:** `migration/react19-multi-version-default-scope` (Option C, Part 3).
> `mfe-app-1` is the React 19 workspace; the other three applications keep the Part 1
> baseline versions deliberately. The React 19 change list is in
> [migration-option-c.md](./migration-option-c.md#5-react-19-application-changes-app-1-only).

## Runtime dependencies (per application, as built on this branch)

| Package          | Version    | Used by                                |
| ---------------- | --------   | -------------------------------------- |
| `react`          | `16.14.0`  | container, mfe-app-2, mfe-app-3        |
| `react-dom`      | `16.14.0`  | container, mfe-app-2, mfe-app-3        |
| `react`          | `19.3.1`   | **mfe-app-1**                          |
| `react-dom`      | `19.3.1`   | **mfe-app-1** (incl. `react-dom/client`) |
| `redux`          | `4.0.5` / `5.0.1` | mfe-app-2/3 / **mfe-app-1**    |
| `react-redux`    | `7.2.2` / `9.3.1` | mfe-app-2/3 / **mfe-app-1**    |
| `react-router-dom` | `5.2.0` / `5.3.4` | container (5.2.0) / **mfe-app-1 (5.3.4)** |
| `history`        | `4.10.1`   | container (memory history)             |

On `main` all four apps use exactly React/React DOM `16.14.0`. Here each React 19
package still matches its DOM counterpart **within** the application, which is what the
`react` + `react-dom` shared descriptors negotiate and the tests verify at runtime.

## Build tooling

| Package                    | Version    |
| -------------------------- | ---------- |
| `webpack`                  | `^5.94.0` (installed 5.112.2) |
| `webpack-cli`              | `^5.1.4`   |
| `webpack-dev-server`       | `^4.15.2`  |
| `@babel/core`              | `^7.26.0`  |
| `@babel/preset-env`        | `^7.26.0`  |
| `@babel/preset-react`      | `^7.25.9` (classic runtime) |
| `babel-loader`             | `^8.4.1`   |
| `html-webpack-plugin`      | `^5.6.3`   |
| `tailwindcss`              | `2.2.19`   |
| `postcss`                  | `8.4.49`   |
| `autoprefixer`             | `10.4.20`  |
| `postcss-loader`           | `6.2.1`    |
| `css-loader` / `style-loader` | `^6` / `^3` |

## Test tooling

Two Jest stacks coexist on this branch because the React 16-era tooling cannot drive
React 19 and vice versa.

Root (container, mfe-app-2, mfe-app-3, shared modules — Jest 26 project):

| Package                       | Version   |
| ----------------------------- | --------- |
| `jest`                        | `26.6.3`  |
| `babel-jest`                  | `26.6.3`  |
| `@testing-library/react`      | `11.2.5`  |
| `@testing-library/jest-dom`   | `5.11.9`  |
| `@testing-library/user-event` | `12.6.0`  |
| `@playwright/test`            | `1.45.3`  |

`mfe-app-1` workspace (React 19 — Jest 30 project, installed as workspace devDependencies):

| Package                       | Version   |
| ----------------------------- | --------- |
| `jest` / `babel-jest`         | `30.5.2`  |
| `jest-environment-jsdom`      | `30.5.2`  |
| `@testing-library/react`      | `16.3.3`  |
| `@testing-library/dom`        | `10.4.2`  |
| `@testing-library/jest-dom`   | `6.9.1`   |
| `@testing-library/user-event` | `14.6.8`  |

`jest-dom@6.10.0` was **rejected on purpose**: npm's own install warning says that
release is "incorrect minor release with breaking changes (Node >=22 and required
`@testing-library/dom` peer)". `6.9.1` is the last good release of the 6.x line.

## Quality tooling

| Package                        | Version  |
| ------------------------------ | -------- |
| `eslint`                       | `^7.32.0`|
| `eslint-plugin-react`          | `^7.28.0`|
| `eslint-plugin-react-hooks`    | `^4.3.0` |
| `@babel/eslint-parser`         | `^7.25.9`|
| `prettier`                      | `^2.8.8` |

## Peer-dependency verification performed

Per PRD 3.1 ("verify the selected packages' peer dependencies and compatibility
before installing them"), every install was driven by npm's ERESOLVE resolver and
the outcome observed and acted upon:

- **React-related libraries** were checked against React **16.14.0**: `react-redux`
  7.2.2 (peer `^16.9.0 || ^17`), `react-router-dom` 5.2.0 (peer `>=15`),
  `@testing-library/react` 11.2.5 (peer `react`/`react-dom` `>=16.6.0`), Jest 26 +
  RTL 11 + `jest-dom` 5 + `user-event` 12 are a mutually consistent set.
- **Jest on Node 24**: the plan flagged a possible `graceful-fs` ESM-export crash
  for Jest 26 on modern Node. Verified empirically — Jest 26.6.3 **runs correctly
  on Node 24** once `graceful-fs` is overridden to `^4.2.11` (see overrides below).
  **No bump to Jest 27 was required.**

### Peer checks for the React 19 upgrade (Option C, this branch)

Only packages with a React-19 peer wall were moved (PRD 3.2). Each decision below was
read from the registry before installing, not assumed:

| Package | Decision | Evidence checked |
| --- | --- | --- |
| `react` / `react-dom` | **19.3.1** (PRD suggested 19.3.0) | `npm view react dist-tags` → `latest: 19.3.1`; `react-dom` `latest: 19.3.1` (matching). No canary/experimental tag used. |
| `react-redux` | 7.2.2 → **9.3.1** | peer `react: "^18.0 \|\| ^19"`, `redux: "^5.0.0"` (both optional-flagged, but redux is a real runtime need). v7's peer range excludes React 19. |
| `redux` | 4.0.5 → **5.0.1** | required by react-redux 9's peer. `createStore`/`combineReducers` still exported, so App 1's store code did not change. |
| `react-router-dom` | 5.2.0 → **5.3.4** (App 1 only) | v5's public API is identical, so no route code changed. Reason: 5.2.0 pulls `mini-create-react-context@0.4.1`, whose own peer range is `^0.14 \|\| ^15 \|\| ^16 \|\| ^17` (React 19 excluded) and whose fallback implementation uses the legacy `childContextTypes`/`contextTypes` APIs React 19 removed. 5.3.x — the final v5 line — drops that dependency. Container/App 2/App 3 deliberately stay on 5.2.0 so the React 16 side is untouched. |
| `history` | unchanged (container only) | not part of the React 19 workspace. |
| RTL / Jest / user-event / jest-dom | installed **inside** `mfe-app-1` | RTL 16 peer `react: ^18 \|\| ^19` + `@testing-library/dom ^10`; Jest 30 needs `jest-environment-jsdom` as a separate package. |

**Hoisting consequence.** With npm workspaces, packages the workspaces agree on are
hoisted to the root — including `react-router-dom` and `use-sync-external-store`, whose
own `require("react")` therefore resolves to the root **React 16**. In the React 19 build
that leaked a mislabeled provider into the default scope. The fix is a build-level
`resolve.alias` pinning `react`/`react-dom` to the generation each workspace declares
([migration-option-c.md 6.2](./migration-option-c.md#62-npm-workspaces-hoisting-can-leak-the-other-generation-into-a-build-found-and-fixed)).
No dependency version was chosen to work around it, and nothing was force-nested.

## Documented deviations from the PRD's candidate versions

The PRD states these are "candidate legacy-compatible versions, not an instruction
to install unverified versions blindly." The following deviations were necessary and
are recorded per PRD §3.1 / §11:

1. **Tailwind / PostCSS / autoprefixer.** The PRD's suggested combination
   (`tailwindcss@2.0.4` + `postcss@7` + `autoprefixer@9`) is **not installable**:
   `tailwindcss@2.0.4`'s own `package.json` declares
   `peer autoprefixer@"^10.0.2"`, so npm ERESOLVE rejects it against autoprefixer 9.
   Deviation: **`tailwindcss@2.2.19`** (still Tailwind **2.x**, as required),
   **`postcss@8.4.49`**, **`autoprefixer@10.4.20`**, **`postcss-loader@6.2.1`**.
   Functionality (Tailwind 2 utility classes) is unchanged.

2. **`babel-jest` version.** `babel-jest` tracks the Jest major; there is no `7.x`
   line. It is pinned to **`26.6.3`** to match Jest 26.

3. **Root-level React pinning + shared runtime libs as root devDependencies.** npm 7+
   auto-installed `react@19` / `react-dom@19` at the workspace root to satisfy
   `@testing-library/react`'s `>=16.6.0` peer range. The apps' own nested 16.14.0
   kept the webpack builds correct, but Jest (which resolves tooling from the root)
   picked up React 19 and failed with `ReactDOM.render is not a function`. Fix for
   the all-React-16 baseline: pin `react`/`react-dom` `16.14.0` (and
   `redux`/`react-redux`/`react-router-dom`/`history`) as **root devDependencies**
   so tooling and app code agree on 16.14.0. This pinning is **baseline-only**; the
   Part 2/3 branches manage per-app React versions instead.

4. **ESLint parser.** ESLint 7's bundled espree cannot parse class instance fields
   (`state = {...}`) used by the legacy class components. Switched to
   **`@babel/eslint-parser`** (`requireConfigFile: false`), which parses them through
   the existing Babel config.

5. **`overrides.graceful-fs: ^4.2.11`** (root `package.json`) — avoids the
   `graceful-fs` polyfill crash that older transitive copies cause on Node 20+/24.

## Tailwind purge note

Tailwind v2 only enables `purge` when `process.env.NODE_ENV === "production"`, but
`webpack --mode production` does **not** set that env var for PostCSS plugins. Left
unchecked, every build embedded the full ~3.7 MB stylesheet. `tailwind.config.js`
therefore sets `purge: { enabled: true, content: [...] }` with **absolute** content
paths (globs resolve against the per-app build CWD in a workspace). This dropped the
shared CSS chunk from 4.82 MiB to ~21 KiB.

## Legacy & security status

These React-16-era dependencies are intentionally used to create a realistic
migration baseline. They are **legacy and largely out of security support**:

- **React / React DOM 16.14.0** — React 16 reached end-of-support; superseded by
  17/18/19. (Upgrading one remote is the whole point of Parts 2–3; on this branch
  `mfe-app-1` is on the currently supported 19.3.1 and three apps remain legacy
  deliberately, to keep the mixed-version comparison realistic.)
- **Redux 4.0.5 / React Redux 7.2.2** — old majors in the React 16 apps (App 1 moved to
  Redux 5.0.1 / React-Redux 9.3.1).
- **React Router DOM 5.2.0** (container) — v5 uses the `history@4` API and is end-of-line; v6/v7
  are a rewrite. It is retained on purpose for the React 16 side: replacing the router would be an
  unrelated rewrite for a sharing-strategy comparison. App 1 moved within the v5 line to **5.3.4**,
  the last v5 release, which no longer depends on the legacy-context polyfill.
- **Jest 26 / RTL 11 / jest-dom 5 / user-event 12** — several majors behind (App 1's
  workspace uses Jest 30 / RTL 16 / jest-dom 6.9.1 / user-event 14).
- **ESLint 7** — the npm installer already warns it is end-of-support.

`npm install` surfaced deprecation warnings for transitive packages (e.g. `glob@7`,
`rimraf@3`, `abab`, `whatwg-encoding`, `sane`, `mini-create-react-context`). These
are **accepted for the baseline** to preserve React-16 realism and are recorded here
rather than hidden. **Do not treat this lockfile as a production-ready dependency
set.** During the React 19 migration only dependencies that are incompatible with
React 19, or required by the new rendering/testing/JSX APIs, are upgraded (PRD 3.2).
