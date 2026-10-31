/**
 * Babel configuration for the React 19 application (Option B).
 *
 * Webpack's babel-loader runs with `rootMode: "upward"`, so building this
 * workspace (cwd = mfe-app-1) picks up THIS file, while the React 16 apps keep
 * using the repo-root babel.config.js. The unit-test project for App 1 points
 * babel-jest at this file explicitly (see tests/unit/mfe-app-1/jest.config.js).
 *
 * React 19 uses the automatic JSX runtime, so components no longer need
 * `import React` in scope and the emitted code imports `react/jsx-runtime` —
 * which is exactly why the webpack config shares the `react/` subpath in the
 * "react19" scope.
 */
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: "last 2 Chrome versions, last 2 Firefox versions, not dead",
        // Keep ESM for webpack; babel-jest needs CJS.
        modules: process.env.BABEL_ENV === "test" || process.env.NODE_ENV === "test" ? "commonjs" : false,
      },
    ],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};
