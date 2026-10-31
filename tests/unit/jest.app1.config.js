const path = require("path");
const fs = require("fs");

/**
 * Jest project for the React 19 workspace (mfe-app-1).
 *
 * It runs on the workspace's OWN nested tooling (Jest 30 + babel-jest 30 +
 * jest-environment-jsdom 30 + RTL 16), because the repo root keeps Jest 26 +
 * RTL 11 for the React 16 workspaces. Two things make the split safe:
 *
 *  1. `rootDir` is the APP directory. Jest resolves `testEnvironment`,
 *     `babel-jest` and reporters relative to rootDir, so a repo-root rootDir
 *     would pick up the hoisted Jest 26 copies and crash.
 *  2. Every React-related specifier is pinned to the app's own node_modules.
 *     Test files live under tests/, so an unpinned `require("react")` would walk
 *     up to the repo root and load React 16 — and the pin also governs
 *     transitive requires (react-redux -> use-sync-external-store -> react).
 */
const repoRoot = path.resolve(__dirname, "..", "..");
const appDir = path.join(repoRoot, "mfe-app-1");

// Resolve a package root through the app's dependency tree, so the mapping stays
// correct whether npm nested a package or happened to hoist it. `<name>/package.json`
// is not always an exported subpath (user-event 14 blocks it), so the entry file is
// used and walked up to the directory whose package.json declares that name.
function packageDir(name) {
  let entry;
  try {
    entry = require.resolve(path.join(name, "package.json"), { paths: [appDir] });
  } catch (err) {
    entry = require.resolve(name, { paths: [appDir] });
  }
  let dir = path.dirname(entry);
  while (dir !== path.dirname(dir)) {
    const manifest = path.join(dir, "package.json");
    if (fs.existsSync(manifest)) {
      try {
        if (JSON.parse(fs.readFileSync(manifest, "utf8")).name === name) {
          return dir;
        }
      } catch (err) {
        /* unreadable manifest: keep walking up */
      }
    }
    dir = path.dirname(dir);
  }
  throw new Error(`packageDir(): could not locate package root for "${name}"`);
}

const reactDir = packageDir("react");
const reactDomDir = packageDir("react-dom");
const reactReduxDir = packageDir("react-redux");
const reduxDir = packageDir("redux");
const reactRouterDomDir = packageDir("react-router-dom");
const historyDir = packageDir("history");
const rtlDir = packageDir("@testing-library/react");
const rtlDomDir = packageDir("@testing-library/dom");
const userEventDir = packageDir("@testing-library/user-event");
const jestDomDir = packageDir("@testing-library/jest-dom");

module.exports = {
  rootDir: appDir,
  testEnvironment: "jsdom",
  roots: [path.join(repoRoot, "tests", "unit", "mfe-app-1")],
  testMatch: ["**/*.test.js"],
  setupFilesAfterEnv: [path.join(repoRoot, "tests", "jest.setup.app1.js")],
  moduleNameMapper: {
    "\\.(css|less|scss)$": path.join(repoRoot, "tests", "__mocks__", "styleMock.js"),
    "^react$": reactDir,
    "^react/(.*)$": path.join(reactDir, "$1"),
    "^react-dom$": reactDomDir,
    "^react-dom/(.*)$": path.join(reactDomDir, "$1"),
    "^react-redux$": reactReduxDir,
    "^redux$": reduxDir,
    "^react-router$": path.join(packageDir("react-router")),
    "^react-router-dom$": reactRouterDomDir,
    "^history$": historyDir,
    "^@testing-library/react$": rtlDir,
    "^@testing-library/dom$": rtlDomDir,
    "^@testing-library/user-event$": userEventDir,
    "^@testing-library/jest-dom$": jestDomDir,
  },
  transform: {
    // Explicit configFile keeps the automatic JSX runtime independent of the shell's
    // working directory (mfe-app-1/babel.config.js).
    "^.+\\.jsx?$": ["babel-jest", { configFile: path.join(appDir, "babel.config.js") }],
  },
  transformIgnorePatterns: ["/node_modules/"],
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{js,jsx}",
    "!<rootDir>/src/index.js",
    "!<rootDir>/src/bootstrap.js",
  ],
};
