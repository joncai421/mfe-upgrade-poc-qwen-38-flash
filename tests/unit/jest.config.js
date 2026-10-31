const path = require("path");

// Root of the monorepo (this file lives at tests/unit/jest.config.js).
const repoRoot = path.resolve(__dirname, "..", "..");

module.exports = {
  rootDir: repoRoot,
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests/unit"],
  testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  moduleNameMapper: {
    "\\.(css|less|scss)$": "<rootDir>/tests/__mocks__/styleMock.js",
  },
  // Jest runs from the repo root, so babel-jest discovers the root babel.config.js.
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  transformIgnorePatterns: ["/node_modules/"],
  collectCoverageFrom: [
    "container-app/src/**/*.{js,jsx}",
    "mfe-app-1/src/**/*.{js,jsx}",
    "mfe-app-2/src/**/*.{js,jsx}",
    "mfe-app-3/src/**/*.{js,jsx}",
    "!**/index.js",
    "!**/bootstrap.js",
  ],
};
