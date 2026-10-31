const path = require("path");

// Root of the monorepo (this file lives at tests/unit/jest.config.js).
const repoRoot = path.resolve(__dirname, "..", "..");

/**
 * Jest project for the React 16 side of the monorepo (container, mfe-app-2,
 * mfe-app-3 and the shared modules), on Jest 26 + RTL 11.
 * mfe-app-1 runs in its own project — see jest.app1.config.js — and is excluded
 * here so `test:unit` never loads React 19 code with the React 16 tooling.
 */
module.exports = {
  rootDir: repoRoot,
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests/unit"],
  testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/tests/unit/mfe-app-1/"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  moduleNameMapper: {
    "\\.(css|less|scss)$": "<rootDir>/tests/__mocks__/styleMock.js",
  },
  // Explicit root config keeps the classic JSX runtime independent of the shell cwd.
  transform: {
    "^.+\\.jsx?$": ["babel-jest", { configFile: path.resolve(repoRoot, "babel.config.js") }],
  },
  transformIgnorePatterns: ["/node_modules/"],
  collectCoverageFrom: [
    "container-app/src/**/*.{js,jsx}",
    "mfe-app-2/src/**/*.{js,jsx}",
    "mfe-app-3/src/**/*.{js,jsx}",
    "shared/*.js",
    "!**/index.js",
    "!**/bootstrap.js",
  ],
};
