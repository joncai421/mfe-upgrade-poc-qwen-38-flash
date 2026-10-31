# ADR-002: React Version Sharing Strategy

- **Status:** Accepted (baseline decision; revisited and **answered by Part 3 / Option C** — see the outcome below)
- **Date:** 2026-10-31
- **Phase:** Part 1 (baseline, `main`); Part 3 evidence recorded on `migration/react19-multi-version-default-scope`

## Context

All four applications start on React 16.14.0. Module Federation shares `react` and
`react-dom` through a shared scope. The Part 1 baseline must establish the sharing
mechanism that the two migration strategies (Option B: separate scopes; Option C:
multi-version default scope) will modify. The baseline should reflect the intended
**steady-state** (single shared runtime) rather than a migration workaround.

## Decision

For the baseline on `main`:

- Share `react` and `react-dom` from the **default** share scope.
- Use **`singleton: true`** with **`requiredVersion: "^16.14.0"`**.
- Also declare subpath entries **`react/`** and **`react-dom/`** (trailing-slash
  package sharing) with the same options.
- **Retain local fallbacks** (do not set `import: false`) so an app can resolve its
  own React if no compatible provider is present.
- Do **not** use a custom `shareKey`, `eager: true`, or `strictVersion: true` in the
  baseline.

```js
shared: {
  react:       { singleton: true, requiredVersion: "^16.14.0" },
  "react-dom":  { singleton: true, requiredVersion: "^16.14.0" },
  "react/":     { singleton: true, requiredVersion: "^16.14.0" },
  "react-dom/": { singleton: true, requiredVersion: "^16.14.0" },
}
```

## Consequences

- **Single runtime guaranteed at baseline.** With identical 16.14.0 everywhere,
  `singleton: true` selects one React for the page; there is no version negotiation
  surface yet. Verified at runtime by the integration `react-version-resolution`
  suite and E2E `react-runtime` suite (both read `getRuntimeInfo()` in-browser,
  never `package.json`).
- **Subpath entries are forward-looking.** React 16 + classic JSX runtime does not
  import `react/jsx-runtime` today, so the subpath entries are inert at baseline but
  keep the contract correct for Part 2/3 (which need `react/jsx-runtime`,
  `react-dom/client`). They do not change baseline sharing behaviour.
- **Fallbacks kept** because disabling them is only justified for a specific
  strategy; PRD 11 forbids removing local fallbacks without a documented reason.

## Revisit in Part 2 / Part 3

- **Option B (Part 2):** two scopes `react16` / `react19`, each `singleton: true` +
  `strictVersion: true`; host initialises each remote in its scope. Baseline's
  `singleton: true` is preserved *within* each scope.
- **Option C (Part 3):** one default scope, `singleton: false`, `strictVersion: true`,
  matching `requiredVersion`; requires verifying **actual runtime provider selection**
  and initialisation-order independence, not just config.

## Part 3 outcome (Option C, as implemented and measured)

Option C was implemented and **works**: App 1 on React 19.3.1 and three applications on
React 16.14.0 run on one page, inside a single `default` scope, each consuming its own
generation.

What the evidence showed (full detail in
[migration-option-c.md](../migration-option-c.md)):

1. **`requiredVersion` does the separating, not the scope name.** `singleton: false` merely
   allows two versions to be registered; the semver range plus `strictVersion: true` is what
   guarantees a React 16 consumer cannot pick up 19.3.1 (or the reverse).
2. **Version strings are not proof of sharing.** A silent local fallback still reports
   `16.14.0`, so provider selection was verified by **module-object identity**
   (`shared/runtime-identity.js`, surfaced on the Diagnostics page and asserted in the
   integration/E2E suites) and by the browser's own network log
   (`npm run perf:measure`: 21 JS requests, 0 assets fetched twice, exactly 2 React and 2
   React DOM instances on the page).
3. **Order independence holds in this application.** The host consumes React before it loads
   any remote, so its `16.14.0` entry is already loaded and stays the provider; the
   React 16 apps then share that single copy regardless of the order their remotes are
   activated. Loading-order sequences, repeated switching, refresh and concurrent mounts are
   all covered by tests.
4. **A monorepo hazard had to be closed.** npm-workspaces hoisting let the root React 16
   enter the React 19 compilation through `react-router-dom` /
   `use-sync-external-store`, and webpack registered it as `react@19.3.1` — a mislabeled
   provider. Fixed with a per-build `resolve.alias` that pins `react`/`react-dom` to the
   generation each workspace declares, and covered by a unit test so it cannot regress.
5. **Pinning `version` in each shared descriptor is load-bearing** for deterministic
   provider registration; the baseline never needed it because it had one version.
6. **Cost:** the page ships both runtimes during migration (same cost as Option B), and App 1's
   production JS grows from 203.7 KiB to 296.4 KiB while the three React 16 builds are
   essentially unchanged (< 1 KiB each).

Conclusion recorded against this ADR: the default scope can host two React generations
reliably, provided (a) generation-specific `requiredVersion` + `strictVersion`, (b) pinned
`version`, (c) per-build resolution pinning in a hoisted monorepo, and (d) sharing verified by
instance identity and network data rather than by versions or config.

## Alternatives considered

- **`singleton: false` at baseline:** rejected — the baseline is the React-16 steady
  state and should prove single-runtime sharing; multi-version is the migration
  question, not the starting point.
- **Custom `shareKey` per version:** rejected per PRD 5.3/6.3 unless a demonstrated
  need arises.
- **`eager: true`:** rejected (PRD 11) — remotes are loaded on demand.
