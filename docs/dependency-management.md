# Dependency Management

All versions are **pinned** (exact or caret within one major) and committed in
`package-lock.json`. Install reproducibly with `npm ci`.

This is a deliberately **React-16-era reference scaffold** for evaluating a
migration. It is **not** a production dependency recommendation. See
[Legacy & security status](#legacy--security-status).

## Baseline runtime dependencies (per application)

| Package          | Version  | Used by                          |
| ---------------- | -------- | -------------------------------- |
| `react`          | `16.14.0`| all four apps (exact, matching)  |
| `react-dom`      | `16.14.0`| all four apps (exact, matching)  |
| `redux`          | `4.0.5`  | mfe-app-1/2/3                    |
| `react-redux`    | `7.2.2`  | mfe-app-1/2/3                    |
| `react-router-dom` | `5.2.0`| container, mfe-app-1            |
| `history`        | `4.10.1` | container (memory history)       |

`react` and `react-dom` versions match exactly across all four apps on `main`.

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

| Package                       | Version   |
| ----------------------------- | --------- |
| `jest`                        | `26.6.3`  |
| `babel-jest`                  | `26.6.3`  |
| `@testing-library/react`      | `11.2.5`  |
| `@testing-library/jest-dom`   | `5.11.9`  |
| `@testing-library/user-event` | `12.6.0`  |
| `@playwright/test`            | `1.45.3`  |

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
  17/18/19. (Upgrading one remote is the whole point of Parts 2–3.)
- **Redux 4.0.5 / React Redux 7.2.2** — old majors (Redux 5 / React-Redux 9 exist).
- **React Router DOM 5.2.0** — v5 uses the `history@4` API; v6+ is a rewrite.
- **Jest 26 / RTL 11 / jest-dom 5 / user-event 12** — several majors behind.
- **ESLint 7** — the npm installer already warns it is end-of-support.

`npm install` surfaced deprecation warnings for transitive packages (e.g. `glob@7`,
`rimraf@3`, `abab`, `whatwg-encoding`, `sane`, `mini-create-react-context`). These
are **accepted for the baseline** to preserve React-16 realism and are recorded here
rather than hidden. **Do not treat this lockfile as a production-ready dependency
set.** During the React 19 migration only dependencies that are incompatible with
React 19, or required by the new rendering/testing/JSX APIs, are upgraded (PRD 3.2).
