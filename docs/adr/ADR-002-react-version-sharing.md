# ADR-002: React Version Sharing Strategy

- **Status:** Accepted (baseline decision; Part 2/3 revisit this)
- **Date:** 2026-10-31
- **Phase:** Part 1 (baseline, `main`)

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

## Alternatives considered

- **`singleton: false` at baseline:** rejected — the baseline is the React-16 steady
  state and should prove single-runtime sharing; multi-version is the migration
  question, not the starting point.
- **Custom `shareKey` per version:** rejected per PRD 5.3/6.3 unless a demonstrated
  need arises.
- **`eager: true`:** rejected (PRD 11) — remotes are loaded on demand.
