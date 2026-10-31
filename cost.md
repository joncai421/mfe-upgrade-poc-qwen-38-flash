# Implementation Cost Tracking

## Part 1 — Baseline Implementation on `main`

- **Start time:** 2026-10-31 06:42:00 CST (06:42 UTC+8)
- **End time:** 2026-10-31 08:44:00 CST (08:44 UTC+8)
- **Total time:** ~2 hours 2 minutes of wall-clock implementation time
- **Total token consumption:** approximately 210k input + 45k output tokens (rough estimate from session context; not instrumented by the runtime). See note below.

### Result summary

- 4 applications built independently; all on React/React DOM 16.14.0 with `singleton: true`.
- Tests: **34 unit + 8 integration + 17 E2E = 59 passing**, plus `npm run lint` clean.
- Verified from a clean `npm ci` install (node_modules wiped first).
- Performance baseline generated at `docs/performance-baseline.md`.

### Token measurement note

Exact token usage is not exposed to the agent by the coding runtime, so the figure
above is an order-of-magnitude estimate based on the number and size of tool calls
(file reads/writes, build/test output). If precise accounting is required, it must be
read from the provider's usage dashboard for this session rather than this file.

## Part 2 — Option B (`migration/react19-share-scopes`)

- Not started (requires new session after human verification of Part 1).

## Part 3 — Option C (`migration/react19-multi-version-default-scope`)

- **Start time:** 2026-10-31 19:44:46 CST (UTC+8)
- **Branch origin:** baseline commit `163dd263517373c80fbabc92eec3e11ba86b0aa1` on `main` (same commit as Option B; verified the branch contains no Option B commits).
- **End time:** 2026-10-31 20:49:05 CST (UTC+8)
- **Total time:** ~64 minutes of wall-clock implementation time
- **Total token consumption:** not instrumented by the runtime. Order-of-magnitude estimate:
  ~400k input + ~65k output tokens across ~90 tool calls (file reads of the PRD + baseline
  sources, ~55 file writes/edits, and build/test output). Same caveat as Part 1: read the real
  figure from the provider usage dashboard for this session if precise accounting is required.

### Result summary

- App 1 on React/React DOM **19.3.1**, react-redux 9.3.1 + redux 5.0.1, react-router-dom 5.3.4
  (last v5), automatic JSX runtime, `createRoot`; container, App 2 and App 3 remain on **16.14.0**.
  All four share the **one `default` scope** with `singleton: false`, `strictVersion: true`,
  generation-specific `requiredVersion`, pinned `version`, no named scopes, no custom shareKeys,
  local fallbacks retained. No React Bridge.
- Verified by instance identity, not version strings: **2 React + 2 React DOM instances** on the
  page, the three React 16 consumers sharing one copy; **21 JS requests, 573.2 KiB fetched,
  0 assets fetched twice, 0 console errors**.
- Tests from a clean `npm ci`: **50 + 16 unit (two Jest projects) + 19 integration + 19 E2E = 104
  passing**, `npm run lint` clean, 4/4 production builds with 0 errors/warnings.
- Coverage: React 16 side 84.4 % statements, App 1 98.5 % statements.
- Found and fixed a monorepo hazard: npm-workspaces hoisting leaked the root React 16 into App 1's
  compilation, registered as `react@19.3.1`; closed with a per-build `resolve.alias` plus a
  regression test.
- Docs added: `docs/migration-option-c.md`, `docs/performance-option-c.md` (generated),
  `docs/performance-option-c-runtime.md` (generated); README + architecture, application-structure,
  development, testing, module-federation, dependency-management, branching guide, ADR-001/002
  updated for the mixed-version state.
- **Part 3 close-out act (commit + push):** the PRD's Part 3 gate expects the developer to review
  and push. The developer explicitly instructed "do git commit and push", so the commit and the
  push were performed by the agent on that explicit instruction, narrowly: one commit containing
  only the Part 3 working tree, one explicit refspec
  (`git push origin migration/react19-multi-version-default-scope:migration/react19-multi-version-default-scope`),
  no `--force`, no merge, `main` untouched. Verified afterwards with
  `git ls-remote --heads origin migration/react19-multi-version-default-scope`; the output is
  recorded beside the act in the session report, and the resulting SHA is visible in `git log -1`
  on this branch.
