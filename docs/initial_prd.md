# PRD: React 16 to React 19 Migration with Webpack 5 Module Federation

**Document version:** 1.0  
**Date:** October 31, 2026  
**Status:** Ready for implementation  
**Development approach:** Spec-Driven Development (SDD)  
**Target:** Webpack 5 + React 16/19 Micro-Frontend Architecture

---

# 1. Project Overview

## 1.1 Background

The objective is to build a reference Micro-Frontend (MFE) application using Webpack 5 Module Federation, consisting of:

- One container/host application.
- Three independently built React micro-frontend applications.
- All applications initially running React 16.x.
- All applications sharing a single React runtime through Webpack Module Federation using `singleton: true`.

After establishing the baseline application, two independent implementation approaches will be evaluated for gradually upgrading one of the micro-frontends from React 16 to React 19.

The upgrade should demonstrate that React 16 and React 19 applications can coexist on the same page during a gradual migration, without requiring all applications to upgrade simultaneously.

Two implementation options must be delivered on separate Git branches:

**Option B — Separate Module Federation share scopes**

- React 16 applications use the `react16` share scope.
- React 19 applications use the `react19` share scope.
- `singleton: true` is retained within each scope.

**Option C — Multiple React versions in the default share scope**

- All applications use the default share scope.
- `singleton: false` allows multiple React versions to coexist.
- `requiredVersion` and `strictVersion` control dependency resolution.

Both implementations must be independently testable and must originate from the same completed baseline commit on `main`.

For each part of implementation (Part 1, 2 and 3), create a cost.md in the project root, record the implementation start time when start, and record the end time, total time, and total token consumption at the end.

## 1.2 Primary Objectives

1. Establish a functional React 16 MFE reference architecture.
2. Implement two alternative React 19 migration strategies.
3. Minimize application code changes during React version upgrades.
4. Verify runtime compatibility between the container and independently upgraded micro-frontends.
5. Establish automated unit, integration, E2E and regression testing.
6. Provide sufficient documentation for developers to reproduce, understand and extend the implementation.
7. Compare both migration strategies so that a preferred strategy can be selected for a larger MFE infrastructure.

## 1.3 Out of Scope

The following are explicitly excluded:

- Migrating all three micro-frontends to React 19.
- React Bridge or `@module-federation/bridge-react`.
- Migrating from Webpack to Vite, Rspack or another bundler.
- Converting the application to Next.js or server-side rendering.
- Introducing a new cross-application state management framework.
- Replacing Redux.
- Introducing production authentication or backend services.
- Deploying to cloud infrastructure.
- Automatically merging the two implementation branches.

The implementation should focus on React dependency compatibility and Module Federation behaviour.

---

# 2. Target Architecture

## 2.1 Application Structure

The application consists of four independent Webpack builds.

| Application | Responsibility | Initial React version | Port |
|---|---|---|---|
| Container | Application shell, navigation and remote loading | 16.14.0 | 3000 |
| MFE App 1 | First micro-frontend; target for React upgrade | 16.14.0 | 3001 |
| MFE App 2 | Second micro-frontend | 16.14.0 | 3002 |
| MFE App 3 | Third micro-frontend | 16.14.0 | 3003 |

The container should load all three micro-frontends through Webpack Module Federation.

Each application must be independently buildable and runnable.

## 2.2 Application Integration Contract

Each micro-frontend must expose a framework-independent mounting interface.

The exported interface should provide:

- `mount(element, props)` — mounts the micro-frontend into a supplied DOM element.
- `unmount()` — releases the application's React root and associated resources.

The mount function should return an object containing an unmount function and optional diagnostic information.

For example:

```javascript
{
  unmount: () => {},
  getRuntimeInfo: () => ({
    reactVersion: "16.14.0",
    reactDomVersion: "16.14.0"
  })
}
```

The implementation may adapt this interface to suit the existing project structure.

**Important architectural constraints:**

1. Each micro-frontend must have its own React root.
2. React components must not be passed directly between applications running different React major versions.
3. React Context, React hooks and React elements must not cross application boundaries.
4. Applications should communicate through framework-independent interfaces.
5. The container should not need to know which React version an individual remote uses.
6. No React Bridge dependency should be introduced.

This mounting contract must be implemented in the baseline branch so that it can be reused without architectural changes in both upgrade branches.

The container should be responsible for loading, mounting and unmounting applications, not rendering remote components directly in its own React component tree.

## 2.3 Functional Demonstration

The reference application should provide enough functionality to verify that React, Redux, routing, styling and Module Federation are working.

Suggested application content:

| Application | Demonstration functionality |
|---|---|
| Container | Navigation, remote loading, application switching and runtime diagnostics |
| MFE App 1 | Redux counter, basic form and local routing |
| MFE App 2 | Redux-based profile management and form validation |
| MFE App 3 | Redux-based report filtering and result display |

The applications should have a consistent layout and visual design using Tailwind CSS.

Each MFE should demonstrate that its functionality remains independent of the other applications.

---

# 3. Technology Stack and Dependency Requirements

## 3.1 Baseline Technology Stack

The baseline must use React 16.14.0, which is the final React 16 release.

All four applications must use exactly the same versions of:

- `react`
- `react-dom`

The baseline should include the following technologies:

| Category | Technology | Baseline version requirement |
|---|---|---|
| UI framework | React | 16.14.0 |
| DOM renderer | React DOM | 16.14.0 |
| Bundler | Webpack | 5.x |
| Federation | Webpack ModuleFederationPlugin | Included with Webpack 5 |
| Transpilation | Babel | React 16-compatible Babel 7 |
| Styling | Tailwind CSS | 2.x |
| CSS processing | PostCSS | 7.x |
| State management | Redux | 4.x |
| React state binding | React Redux | 7.x |
| Routing | React Router DOM | 5.x |
| Unit testing | Jest | 26.x |
| Component testing | React Testing Library | 11.x |
| DOM testing utilities | jest-dom | 5.x |
| Browser interaction testing | user-event | 12.x |
| E2E testing | Playwright | A stable version compatible with the selected Node.js runtime |
| Code quality | ESLint | React 16-compatible configuration |
| Formatting | Prettier | Compatible pinned version |

Suggested baseline dependency versions include:

- React / React DOM: `16.14.0`
- Redux: `4.0.5`
- React Redux: `7.2.2`
- React Router DOM: `5.2.0`
- Tailwind CSS: `2.0.4`
- PostCSS: `7.x`
- Jest: `26.6.3`
- React Testing Library: `11.2.5`
- jest-dom: `5.11.9`
- user-event: `12.6.0`

These are candidate legacy-compatible versions, not an instruction to install unverified versions blindly. The code agent must verify the selected packages' peer dependencies and compatibility before installing them.

Webpack 5, Babel and the development server must use versions that work together with the selected supported Node.js runtime.

Do not use Create React App or react-scripts as a replacement for the custom Webpack configuration. The purpose of this project is to demonstrate Webpack 5 Module Federation directly.

## 3.2 Dependency Management

The repository should use a consistent package manager and a committed lockfile.

Requirements:

1. Pin dependency versions rather than using wildcard versions.
2. Ensure all four applications use the same React 16.14.0 version on `main`.
3. Ensure `react` and `react-dom` have matching versions.
4. Avoid unnecessary dependency duplication.
5. Document any dependencies that require different versions after the React upgrade.
6. Verify the React peer dependency compatibility of React-related libraries before upgrading.
7. Keep the build reproducible using the package manager's clean-install command.

Do not automatically upgrade every dependency to its latest version during the React 19 migration.

Only upgrade dependencies that are:
- Incompatible with React 19.
- Required by the updated React rendering APIs.
- Required to support the updated testing environment.
- Required to support the updated JSX transformation.

For tooling that is not React-dependent, retain the existing version unless an upgrade is necessary.

React 16-era dependencies are intentionally used in the baseline. Document their legacy and security status. This reference scaffold should not be treated as a production-ready dependency recommendation.

---

# 4. Part 1 — Baseline Implementation on Main

**Git branch:** `main`

This phase establishes the reference application. No React 19 upgrade should be performed in this phase.

## 4.1 Application Setup

Create the following applications:

```text
container-app/
mfe-app-1/
mfe-app-2/
mfe-app-3/
```

A monorepo/workspace structure is preferred to simplify dependency installation, testing and development.

The code agent may use a different directory structure if there is a good architectural reason, but all four builds must remain independently configurable and buildable.

## 4.2 Module Federation Configuration

All applications must use Webpack 5 Module Federation.

The baseline configuration should use:

```javascript
shared: {
  react: {
    singleton: true,
    requiredVersion: "^16.14.0"
  },
  "react-dom": {
    singleton: true,
    requiredVersion: "^16.14.0"
  }
}
```

If the application uses React package subpath imports, such as `react/jsx-runtime`, configure appropriate subpath sharing using Webpack's trailing-slash package sharing syntax.

The same configuration must be applied consistently across the container and all three MFEs.

Requirements:

- One compatible React version is selected for the application page.
- React and React DOM must use matching versions.
- All three remote applications must load successfully through the container.
- The container must be able to mount and unmount each remote.
- Each remote must support independent development and testing.

## 4.3 Application Features

Implement the demonstration features described in Section 2.3.

Each application must demonstrate:

- React component rendering.
- Redux store and reducer functionality.
- At least one interactive UI control.
- Tailwind CSS styling.
- Basic route handling where applicable.
- Mount and unmount lifecycle behaviour.

The container should include navigation to switch among the three remote applications.

## 4.4 Automated Testing

Testing infrastructure must be implemented during this phase, not postponed until the upgrade branches.

### Unit tests

Use Jest and React Testing Library.

Coverage must include:

- Rendering of major application components.
- Redux reducer behaviour.
- Basic UI interactions.
- Form inputs and validation.
- Navigation or routing behaviour.
- Mount and unmount functionality.

Each application must have its own unit test suite.

### Integration tests

Integration tests must validate:

- The container can load each remote application.
- Remote modules are resolved correctly through Module Federation.
- All applications mount into their intended DOM elements.
- Applications can be mounted and unmounted repeatedly.
- Redux state remains isolated between independent MFEs.
- There are no invalid hook call errors.
- There are no unexpected duplicate React runtime errors.
- The applications can coexist on the same page.

Integration tests must use the actual Webpack Module Federation runtime rather than relying exclusively on mocked remote imports.

### E2E tests

Use Playwright to test the complete application in a real browser.

Minimum E2E scenarios:

1. Open the container application.
2. Verify the application shell is displayed.
3. Navigate to MFE App 1.
4. Verify App 1 loads and renders successfully.
5. Interact with its Redux-based functionality.
6. Navigate to MFE App 2.
7. Verify App 2 loads and its functionality works.
8. Navigate to MFE App 3.
9. Verify App 3 loads and its functionality works.
10. Switch between MFEs several times.
11. Verify the previously active application is unmounted correctly.
12. Verify no critical browser console errors or failed remote chunk requests occur.

### CI automation

Provide a CI workflow, preferably GitHub Actions if no CI system already exists.

The pipeline must run:

```text
Dependency installation
       ↓
Lint
       ↓
Unit tests
       ↓
Application builds
       ↓
Integration tests
       ↓
E2E tests
```

The workflow should run automatically when relevant code is pushed or a pull request is created.

All tests must be executable locally using documented commands.

## 4.5 Baseline Performance Measurements

The baseline should establish reference measurements for both build size and browser loading.

Record:

- Container initial JavaScript bundle size.
- Each remote's initial JavaScript bundle size.
- React and React DOM shared dependency sizes.
- Gzipped asset sizes.
- Initial page load requests.
- Remote application loading requests.

Provide a reproducible way to generate Webpack build statistics.

These measurements will be used to compare the upgrade branches.

## 4.6 Documentation

Create the following documentation:

```text
README.md

docs/
  architecture.md
  application-structure.md
  development-guide.md
  testing-guide.md
  module-federation-guide.md
  dependency-management.md
  performance-baseline.md
  branching-and-migration-guide.md
```

The README must explain:

- Project purpose.
- Technology stack.
- Application architecture.
- Prerequisites.
- Installation.
- How to run all applications locally.
- How to run tests.
- How to build the applications.
- Links to the detailed documentation.

The development guide must include the commands and ports for running each application independently and together.

The testing guide must explain the three testing levels and how to execute them.

## 4.7 Part 1 Acceptance Criteria

Part 1 is complete only when all conditions below are met:

- [ ] Four applications exist and build successfully.
- [ ] All four applications use React 16.14.0.
- [ ] All four applications use matching React DOM 16.14.0.
- [ ] Module Federation uses `singleton: true`.
- [ ] The container successfully loads all three remote applications.
- [ ] Each remote has its own React root and mount/unmount contract.
- [ ] Tailwind CSS works.
- [ ] Redux works independently within each application.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] E2E tests pass.
- [ ] CI pipeline is implemented and passes.
- [ ] Bundle-size baseline is documented.
- [ ] README and other required documentation are complete.
- [ ] The application can be started from a clean dependency installation.

**Stop condition:** Once all acceptance criteria are met, the code agent must stop and wait for human verification. Do not start either React 19 upgrade branch yet.

The developer will review, commit and push the completed baseline on `main`.

Record the final baseline commit SHA. Both upgrade branches must use this exact commit as their starting point.

---

# 5. Part 2 — Option B: Separate Module Federation Share Scopes

**Git branch:** `migration/react19-share-scopes`

**Branch origin:** The completed baseline commit on `main`.

Do not create this branch from another upgrade branch.

## 5.1 Objective

Implement a React 19 upgrade for MFE App 1 using separate Module Federation share scopes.

The container, MFE App 2 and MFE App 3 must remain on React 16.14.0.

The resulting architecture must support React 16 and React 19 running on the same page.

## 5.2 Target Version Matrix

| Application | React | React DOM | Share scope |
|---|---|---|---|
| Container | 16.14.0 | 16.14.0 | react16 |
| MFE App 1 | 19.3.0 | 19.3.0 | react19 |
| MFE App 2 | 16.14.0 | 16.14.0 | react16 |
| MFE App 3 | 16.14.0 | 16.14.0 | react16 |

Use React 19.3.0 as the pinned reference target. Verify the latest stable React 19 version and availability when implementation begins. If a newer stable 19.x release has superseded it, update both React and React DOM to that exact matching version and document the change.

Do not use experimental, canary or prerelease packages.

## 5.3 Webpack Configuration

Use two independent share scopes:

- `react16`
- `react19`

React 16 applications should configure their shared dependencies with:

```javascript
shared: {
  react: {
    singleton: true,
    requiredVersion: "^16.14.0",
    strictVersion: true,
    shareScope: "react16"
  },
  "react-dom": {
    singleton: true,
    requiredVersion: "^16.14.0",
    strictVersion: true,
    shareScope: "react16"
  }
}
```

The React 19 application should use:

```javascript
shared: {
  react: {
    singleton: true,
    requiredVersion: "^19.3.0",
    strictVersion: true,
    shareScope: "react19"
  },
  "react-dom": {
    singleton: true,
    requiredVersion: "^19.3.0",
    strictVersion: true,
    shareScope: "react19"
  }
}
```

Configure the host's remote definitions so that each remote is initialized with the appropriate share scope.

Webpack 5 supports a remote definition with an explicit `shareScope`, for example:

```javascript
remotes: {
  mfeApp1: {
    external: "mfeApp1@http://localhost:3001/remoteEntry.js",
    shareScope: "react19"
  },
  mfeApp2: {
    external: "mfeApp2@http://localhost:3002/remoteEntry.js",
    shareScope: "react16"
  },
  mfeApp3: {
    external: "mfeApp3@http://localhost:3003/remoteEntry.js",
    shareScope: "react16"
  }
}
```

The exact configuration must be validated against the selected Webpack 5 version.

Requirements:

1. The container's React runtime must be provided through `react16`.
2. App 2 and App 3 must use `react16`.
3. App 1 must use `react19`.
4. Both React scopes must coexist on the same browser page.
5. Each remote must consume dependencies from its intended scope.
6. Do not introduce a custom `shareKey` unless there is a demonstrated technical requirement.
7. Retain normal local fallback dependencies unless a specific reason justifies disabling them.

Ensure React package subpath imports are handled correctly, including `react/jsx-runtime` and `react-dom/client` where applicable.

## 5.4 React 19 Application Migration

Upgrade only MFE App 1.

Update React and React DOM to the selected React 19 stable version.

Review and update dependencies that have React peer dependency restrictions.

Pay particular attention to:

- React Redux.
- React Router.
- React Testing Library.
- React DOM APIs.
- Babel JSX transformation.
- Other React-dependent libraries.

Do not unnecessarily upgrade the dependencies of the container, App 2 or App 3.

Follow the official React upgrade guidance.

Where practical, use React 18.3 as an intermediate compatibility checkpoint before moving to React 19, as recommended by the React team. The final branch must end with App 1 using React 19, not React 18.

Check and address React 19 migration requirements, including:

- New JSX transform.
- `ReactDOM.render` replacement with `createRoot`.
- `unmountComponentAtNode` replacement with `root.unmount`.
- Removed `ReactDOM.hydrate` API, if used.
- `act` imports from `react` instead of the removed React DOM test utility.
- Removed function-component `propTypes` and `defaultProps` behaviour, where applicable.
- Deprecated or removed legacy APIs.
- Third-party library compatibility.

Preserve existing application functionality and UI behaviour.

No React Bridge implementation should be added.

## 5.5 Regression Testing

The baseline tests established in Part 1 must continue to work.

In addition, verify:

- App 1 runs using React 19.
- Container, App 2 and App 3 remain on React 16.
- Both share scopes are initialized correctly.
- Each MFE loads the expected React and React DOM versions.
- No invalid hook call errors occur.
- No cross-version React component tree integration occurs.
- No application loses functionality.
- App switching works correctly.
- Mount/unmount and repeated navigation work.
- Browser console contains no critical errors.
- No unexpected network requests or failed chunks occur.

The E2E test suite must execute the complete container with all four builds running simultaneously.

Add runtime version diagnostics to make it possible to verify the actual React and React DOM versions used by each application.

Do not rely solely on the `package.json` version or static bundle contents.

## 5.6 Performance Comparison

Compare the results against the Part 1 baseline.

Record:

- Initial bundle sizes.
- React 16 and React 19 shared dependency sizes.
- Actual downloaded JavaScript assets.
- Initial application loading time.
- Remote application loading time.
- Network request count.
- Runtime errors.

The expected result is that applications belonging to the same React generation can share a common runtime within their share scope.

React 16 and React 19 will coexist as separate runtime versions during the migration period.

## 5.7 Documentation

Add:

```text
docs/
  migration-option-b.md
```

Document:

- Architecture of the two share scopes.
- Webpack configuration.
- Remote share scope initialization.
- React 19 dependency changes.
- How to run the upgraded application.
- Testing commands.
- Known limitations.
- Performance measurements.
- How the setup can be reverted or simplified after all applications are upgraded.

## 5.8 Part 2 Acceptance Criteria

- [ ] Branch created from the baseline `main` commit.
- [ ] Only MFE App 1 is upgraded to React 19.
- [ ] Container remains on React 16.14.0.
- [ ] App 2 and App 3 remain on React 16.14.0.
- [ ] Two share scopes are configured correctly.
- [ ] `singleton: true` is maintained within each scope.
- [ ] React 16 and React 19 coexist successfully.
- [ ] No React Bridge dependency is introduced.
- [ ] Existing mount/unmount interface is preserved.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] E2E tests pass.
- [ ] Regression tests pass.
- [ ] Performance comparison is documented.
- [ ] Option B documentation is complete.

**Stop condition:** After completing Part 2, stop and wait for human verification. Do not continue to Part 3 automatically.

The developer will review and push the Option B branch before starting the next development session.

---

# 6. Part 3 — Option C: Multiple React Versions in the Default Share Scope

**Git branch:** `migration/react19-multi-version-default-scope`

**Branch origin:** The same completed baseline commit on `main` used for Option B.

This branch must not be based on the Option B branch.

## 6.1 Objective

Implement the same React 19 upgrade for MFE App 1, but use the default Module Federation share scope.

The configuration must allow multiple React versions to coexist by using `singleton: false` and compatible `requiredVersion` constraints.

## 6.2 Target Version Matrix

| Application | React | React DOM | Share scope | Singleton |
|---|---|---|---|---|
| Container | 16.14.0 | 16.14.0 | default | false |
| MFE App 1 | 19.3.0 | 19.3.0 | default | false |
| MFE App 2 | 16.14.0 | 16.14.0 | default | false |
| MFE App 3 | 16.14.0 | 16.14.0 | default | false |

Verify the latest stable React 19 version at implementation time and pin the selected version consistently.

## 6.3 Webpack Configuration

Use the following configuration for React 16 applications:

```javascript
shared: {
  react: {
    singleton: false,
    requiredVersion: "^16.14.0",
    strictVersion: true
  },
  "react-dom": {
    singleton: false,
    requiredVersion: "^16.14.0",
    strictVersion: true
  }
}
```

Use the following configuration for the React 19 application:

```javascript
shared: {
  react: {
    singleton: false,
    requiredVersion: "^19.3.0",
    strictVersion: true
  },
  "react-dom": {
    singleton: false,
    requiredVersion: "^19.3.0",
    strictVersion: true
  }
}
```

Use the same default share scope across all applications.

Do not introduce separate `react16` or `react19` share scopes.

Do not introduce custom `shareKey` values.

Where required, configure sharing for the relevant React subpath imports:

- `react/`
- `react-dom/`

Ensure the version requirements and sharing behaviour are consistent for both package roots and relevant subpath imports.

Retain local dependency fallbacks so applications can still resolve compatible React dependencies when a matching shared provider is not available.

## 6.4 Dependency Resolution Requirements

The expected behaviour is:

- React 16 consumers resolve a React 16-compatible provider.
- React 19 consumers resolve a React 19-compatible provider.
- Multiple versions can be registered under the same shared module key.
- A consumer selects the highest available version satisfying its `requiredVersion`.
- React and React DOM resolve to matching compatible versions.

Do not assume that setting `singleton: false` alone guarantees correct dependency selection.

The code agent must verify actual runtime provider selection.

The implementation must consider initialization order, remote loading, local fallback behaviour and version negotiation.

Pay particular attention to ensuring that independently loaded applications do not consume an incompatible React version just because another remote has registered its dependencies first.

## 6.5 React 19 Application Migration

Follow the same React 19 upgrade requirements described in Part 2.

Only MFE App 1 should be upgraded.

All other applications must remain at React 16.14.0.

Keep the same mounting interface and application behaviour.

Do not introduce React Bridge.

## 6.6 Regression Testing

Use the same baseline regression suite as Option B.

Additional verification must establish that:

1. All applications participate in the default share scope.
2. React 16 and React 19 are both registered in that scope.
3. Each application's consumer resolves the expected version.
4. React 16 and React 19 applications can execute independently on the same page.
5. Loading order does not cause version resolution problems.
6. Applications can be loaded and unloaded repeatedly.
7. React and React DOM version mismatches do not occur.
8. No invalid hook calls or React runtime errors occur.

Test different application loading sequences.

At minimum, test:

- App 1 (React 19) loaded before App 2 and App 3.
- App 2 and App 3 (React 16) loaded before App 1.
- All applications loaded through normal container navigation.
- Repeated application switching.
- Full page refresh.

The tests must use actual Webpack Module Federation runtime behaviour.

## 6.7 Performance Comparison

Use the same measurements as Option B.

Compare:

- React 16 shared dependency downloads.
- React 19 shared dependency downloads.
- Total downloaded JavaScript.
- Initial application loading.
- Remote loading time.
- Bundle duplication.
- Runtime errors.

Use the same browser, build mode and measurement procedure used for Option B.

## 6.8 Documentation

Add:

```text
docs/
  migration-option-c.md
```

Document:

- Default share scope configuration.
- How multiple React versions coexist.
- `singleton: false` behaviour.
- `requiredVersion` and `strictVersion`.
- Shared dependency resolution.
- Fallback behaviour.
- Runtime initialization and application loading.
- Test results.
- Performance measurements.
- Known limitations.
- How to revert the configuration after migration.

## 6.9 Part 3 Acceptance Criteria

- [ ] Branch created from the same baseline `main` commit as Option B.
- [ ] Only MFE App 1 is upgraded to React 19.
- [ ] Container remains on React 16.14.0.
- [ ] App 2 and App 3 remain on React 16.14.0.
- [ ] All applications use the default share scope.
- [ ] All applications use `singleton: false`.
- [ ] React 16 and React 19 coexist successfully.
- [ ] Actual version resolution is verified.
- [ ] Application initialization-order tests pass.
- [ ] No React Bridge dependency is introduced.
- [ ] Existing mount/unmount interface is preserved.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] E2E tests pass.
- [ ] Regression tests pass.
- [ ] Performance comparison is documented.
- [ ] Option C documentation is complete.

**Stop condition:** After completing Part 3, stop and wait for human verification. Do not merge branches or make additional changes unless instructed.

---

# 7. Cross-Branch Test and Quality Requirements

The same baseline tests must be maintained across all three development phases.

The purpose is to make the comparison meaningful: both React 19 implementation branches must demonstrate the same application functionality.

## 7.1 Test Structure

Recommended test organisation:

```text
tests/
  unit/
    container/
    mfe-app-1/
    mfe-app-2/
    mfe-app-3/

  integration/
    federation-loading/
    react-version-resolution/
    mount-unmount/
    application-isolation/

  e2e/
    navigation.spec.js
    app1.spec.js
    app2.spec.js
    app3.spec.js
    mfe-regression.spec.js
    react-runtime.spec.js
```

The code agent may adjust this organisation to suit the chosen test framework.

## 7.2 Test Execution Requirements

Provide separate scripts for:

- Running all unit tests.
- Running unit tests for an individual application.
- Running integration tests.
- Running E2E tests.
- Running all automated tests.
- Generating test coverage reports.
- Building all applications.
- Generating Webpack build statistics.

The commands must be documented.

## 7.3 Regression Requirements

Regression testing must compare behaviour rather than merely checking that the application compiles.

At minimum, preserve the following:

| Behaviour | Main baseline | Option B | Option C |
|---|---|---|---|
| Container loads | Pass | Pass | Pass |
| App 1 loads | Pass | Pass | Pass |
| App 2 loads | Pass | Pass | Pass |
| App 3 loads | Pass | Pass | Pass |
| Redux interactions | Pass | Pass | Pass |
| Navigation | Pass | Pass | Pass |
| Mount/unmount | Pass | Pass | Pass |
| No critical console errors | Pass | Pass | Pass |
| Correct React version | All 16 | Mixed 16/19 | Mixed 16/19 |

Regression tests must also verify that the upgraded MFE continues to behave consistently with the baseline in its existing features.

A test failure must not be resolved by removing an existing assertion or weakening the test without a documented reason.

## 7.4 Performance Testing

The objective is not necessarily to make the mixed-version migration phase smaller than the original React 16 baseline.

The objective is to understand the cost of running multiple React generations simultaneously and verify that duplicate downloads are avoided within each compatible sharing group.

For both migration branches, report:

- Total JavaScript transfer size.
- Initial JavaScript transfer size.
- React 16 runtime size.
- React 19 runtime size.
- Remote entry transfer size.
- Initial route loading time.
- Subsequent remote loading time.

Use production-mode builds and report compressed and uncompressed sizes.

Do not claim that a shared dependency is downloaded only once based solely on the `shared` configuration. Verify actual browser network requests and loaded modules.

---

# 8. Git Branching and Development Workflow

This section is mandatory.

The code agent must follow this development sequence exactly.

The implementation has three separate phases and three separate human verification gates.

## 8.1 Branch Strategy

The expected Git branch structure is:

```text
main
 |
 |-- Baseline MFE implementation
 |   All applications use React 16
 |
 |-- BASELINE COMMIT
       |
       |-- migration/react19-share-scopes
       |      Option B
       |      React 16 + React 19
       |
       |
       |-- migration/react19-multi-version-default-scope
              Option C
              React 16 + React 19
```

Both migration branches must originate from the same baseline commit.

Do not create Option C from Option B.

Do not merge Option B into `main` automatically.

Do not merge Option C into `main` automatically.

## 8.2 Phase 1 — Main Branch

The code agent must:

1. Check the current Git status.
2. Ensure the working tree is safe to modify.
3. Check out `main`.
4. Implement the complete baseline application.
5. Implement automated tests.
6. Implement documentation.
7. Run all tests and builds.
8. Record the baseline commit SHA once the developer has committed and pushed it.

The code agent must not proceed to either upgrade branch.

At the end, provide:

- Files created and modified.
- Architecture summary.
- Dependency versions.
- Commands for running the project.
- Commands for running each test suite.
- Test execution results.
- Known issues, if any.
- Recommended manual verification steps.

Then stop.

The developer will review and push the baseline.

## 8.3 Phase 2 — Option B Branch

This phase must be started in a new code-agent session after the developer has verified and pushed the baseline.

The code agent must:

1. Read this PRD.
2. Fetch the latest Git references.
3. Verify the baseline commit SHA.
4. Create `migration/react19-share-scopes` from the recorded baseline commit.
5. Implement Option B.
6. Run all unit tests.
7. Run all integration tests.
8. Run all E2E tests.
9. Run the regression suite.
10. Record performance measurements.
11. Complete Option B documentation.

The agent must not make changes to the other upgrade branch.

At the end, provide the same type of implementation and test report as Phase 1.

Then stop and wait for developer verification and push.

Do not continue to Option C.

## 8.4 Phase 3 — Option C Branch

This phase must also be started in a new code-agent session.

The code agent must:

1. Read this PRD.
2. Fetch the latest Git references.
3. Check out the exact baseline commit SHA recorded in Phase 1.
4. Create `migration/react19-multi-version-default-scope` from that baseline commit.
5. Implement Option C independently.
6. Run all unit tests.
7. Run all integration tests.
8. Run all E2E tests.
9. Run the regression suite.
10. Record performance measurements.
11. Complete Option C documentation.

The agent must not inherit implementation code from Option B.

Then stop and wait for developer verification and push.

## 8.5 Human Verification Gates

The following workflow must be enforced:

| Phase | Agent action | Required human action | Next step |
|---|---|---|---|
| Part 1 | Complete baseline on main | Verify and push main | Start new session |
| Part 2 | Complete Option B branch | Verify and push Option B | Start new session |
| Part 3 | Complete Option C branch | Verify and push Option C | Stop |

**Critical instruction to the code agent:**

Do not automatically execute the next phase after completing the current phase.

Do not automatically switch branches after completing a phase.

Do not push to the remote repository.

Do not merge branches.

Do not commit unrelated changes.

Do not assume human verification has been completed.

Only continue when the developer explicitly starts a new session and instructs the agent to work on the next phase.

Each phase must be independently reviewable.

---

# 9. Documentation Deliverables

The final repository should contain the following documentation:

```text
README.md

docs/
  architecture.md
  application-structure.md
  development-guide.md
  testing-guide.md
  module-federation-guide.md
  dependency-management.md
  performance-baseline.md
  branching-and-migration-guide.md

  migration-option-b.md
  migration-option-c.md

  adr/
    ADR-001-micro-frontend-architecture.md
    ADR-002-react-version-sharing.md
```

Documentation requirements:

1. All documents must be written in Markdown.
2. Commands must be executable and verified.
3. Architecture diagrams should be included where useful, preferably Mermaid.
4. Each branch's documentation must clearly describe its implementation.
5. The differences between Option B and Option C must be documented.
6. Testing procedures must be reproducible.
7. Dependencies and their exact versions must be documented.
8. Known limitations and troubleshooting guidance must be included.

The README should provide a quick-start guide and links to the detailed documentation.

---

# 10. Final Evaluation and Comparison

After all three development phases are complete, the developer should be able to compare the two migration approaches.

The code agent must provide a comparison table with the following dimensions:

| Evaluation dimension | Option B | Option C |
|---|---|---|
| Configuration complexity | Report actual effort | Report actual effort |
| Application code changes | Report actual changes | Report actual changes |
| Dependency duplication | Measure | Measure |
| Runtime performance | Measure | Measure |
| Bundle sizes | Measure | Measure |
| Loading behaviour | Measure | Measure |
| Version resolution reliability | Evaluate | Evaluate |
| Initialization-order sensitivity | Evaluate | Evaluate |
| Regression test results | Report | Report |
| Developer maintenance effort | Evaluate | Evaluate |
| Ease of reverting to singleton | Evaluate | Evaluate |

The comparison must be based on the actual implementation and testing results, not theoretical assumptions.

## 10.1 Final Target Architecture

After all applications are eventually upgraded to React 19, the intended final architecture should be:

```text
Container (React 19)
       |
       |-- MFE App 1 (React 19)
       |
       |-- MFE App 2 (React 19)
       |
       |-- MFE App 3 (React 19)

All applications:
  - Same React version
  - Same React DOM version
  - Same default share scope
  - singleton: true
```

The final configuration should be equivalent to the original baseline sharing approach, updated to React 19.

The code agent should document the configuration change required to return to this state, but must not implement this additional final migration phase as part of the current three-phase development scope.

---

# 11. General Instructions to the Code Agent

The following instructions apply to all three phases.

### Implementation quality

- Follow the existing repository conventions where practical.
- Prefer simple and maintainable code.
- Avoid unnecessary abstractions and frameworks.
- Avoid introducing React Bridge.
- Avoid unnecessary changes to application code.
- Keep all four applications independently buildable.
- Keep the Module Federation configuration explicit and understandable.
- Avoid hardcoding remote URLs throughout the application.
- Use environment variables or a central configuration for remote URLs.
- Ensure each Webpack build has a unique `output.uniqueName`.
- Do not use `eager: true` unless there is a demonstrated need.
- Do not disable local dependency fallbacks without a documented reason.

### Testing quality

- Do not skip tests just because they are inconvenient to run.
- Do not replace real Module Federation integration tests with mocked tests.
- Do not consider a successful Webpack build sufficient proof of compatibility.
- Verify the actual React runtime version used by each remote.
- Verify the correct React and React DOM versions are resolved together.
- Capture browser console errors during E2E tests.
- Report skipped tests and their reasons explicitly.

### Development workflow

- Complete one phase at a time.
- Preserve the agreed branch structure.
- Do not move to another phase without explicit developer instruction.
- Do not push changes.
- Do not merge branches.
- Report implementation results and test results before stopping.

### Handling technical uncertainty

If a proposed Module Federation configuration does not work as expected:

1. Inspect the generated Webpack configuration.
2. Inspect the actual runtime share scopes.
3. Inspect remote initialization behaviour.
4. Verify provider and consumer version resolution.
5. Refer to official Webpack documentation.
6. Implement the smallest reliable correction.
7. Document any deviation from this specification.

Do not silently substitute a different sharing strategy.

If the required architecture cannot be implemented as specified, report the technical blocker and the evidence supporting it before changing the architectural approach.

---

# 12. Definition of Done

The overall project is complete when:

- The baseline React 16 MFE architecture exists on `main`.
- The baseline is covered by automated unit, integration and E2E tests.
- Option B exists on its own branch and successfully upgrades MFE App 1 to React 19.
- Option C exists on its own branch and successfully upgrades MFE App 1 to React 19.
- Both migration implementations originate from the same baseline commit.
- Both implementations successfully run React 16 and React 19 applications simultaneously.
- Existing baseline functionality passes regression testing.
- Performance measurements are available for all three versions of the architecture.
- Documentation is complete and reproducible.
- The developer has independently verified and pushed each phase.

**The final deliverable is three independently reviewable Git states:**

1. `main` — React 16 baseline with singleton sharing.
2. `migration/react19-share-scopes` — React 16/19 coexistence using separate share scopes.
3. `migration/react19-multi-version-default-scope` — React 16/19 coexistence using multiple versions in the default share scope.

The developer will decide which migration strategy is more suitable for the larger MFE infrastructure after reviewing the implementation and comparison results.