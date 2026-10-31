const path = require("path");
const fs = require("fs");

// Monorepo root (this file lives at tests/unit/mfe-app-1/jest.config.js).
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const appRoot = path.resolve(repoRoot, "mfe-app-1");

// Option B — dedicated unit-test project for the React 19 application.
//
// mfe-app-1 installs React 19.3.1 in its OWN workspace tree, while the repo root
// still hoists React 16.14.0 for the container and Apps 2/3. Jest resolves bare
// specifiers relative to the test file (tests/unit/**), which would pick up React 16
// and the React 16-era testing stack, so every React-related specifier is pinned to
// the copy installed for mfe-app-1 (see moduleNameMapper below).
//
// moduleNameMapper applies to the whole run, not just the test file, so transitive
// requires (react-redux -> use-sync-external-store -> react, react-router-dom ->
// react) resolve to the SAME single React 19 copy — one runtime per project, just
// like the webpack shared scope guarantees in the browser.

/**
 * Resolves the copy a package points to for mfe-app-1 by walking up the workspace
 * tree the way Node does and taking the first `node_modules/<name>` that exists:
 * React 19 and the React 19-compatible test stack are installed under
 * mfe-app-1/node_modules, while only shared tooling stays hoisted to the root.
 */
function pkgDir(name) {
  let dir = appRoot;
  for (;;) {
    const candidate = path.join(dir, "node_modules", name);
    if (fs.existsSync(path.join(candidate, "package.json"))) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Cannot resolve "${name}" from ${appRoot}`);
}

const APP_TREE_PACKAGES = [
  "react",
  "react-dom",
  "redux",
  "react-redux",
  "react-router",
  "react-router-dom",
  "history",
  "@testing-library/dom",
  "@testing-library/jest-dom",
  "@testing-library/react",
  "@testing-library/user-event",
];

const moduleNameMapper = {
  "\\.(css|less|scss)$": "<rootDir>/../tests/__mocks__/styleMock.js",
};

for (const name of APP_TREE_PACKAGES) {
  const pattern = name.replace(/\./g, "\\.");
  const dir = pkgDir(name);
  moduleNameMapper[`^${pattern}$`] = dir;
  // Subpath imports (react/jsx-runtime, react-dom/client) stay in the same tree.
  moduleNameMapper[`^${pattern}/(.*)$`] = `${dir}/$1`;
}

module.exports = {
  // rootDir is the APP directory, not the repo root: jest resolves
  // `testEnvironment`, `babel-jest` and friends relative to rootDir, and only
  // mfe-app-1/node_modules holds the Jest 30 / React 19-compatible copies. The
  // test files themselves still live with the rest of the suite in tests/unit.
  rootDir: appRoot,
  testEnvironment: "jsdom",
  roots: ["<rootDir>/../tests/unit/mfe-app-1"],
  testMatch: ["<rootDir>/../tests/unit/mfe-app-1/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/../tests/unit/mfe-app-1/jest.setup.js"],
  moduleNameMapper,
  // React 19 app code uses the automatic JSX runtime (mfe-app-1/babel.config.js).
  transform: {
    "^.+\\.jsx?$": ["babel-jest", { configFile: path.resolve(appRoot, "babel.config.js") }],
  },
  transformIgnorePatterns: ["/node_modules/"],
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!**/index.js", "!**/bootstrap.js"],
};
