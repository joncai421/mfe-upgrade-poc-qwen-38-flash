/**
 * Babel root config for the React 19 workspace.
 *
 * babel-loader is configured with `rootMode: "upward"`, and each app builds with
 * that app's directory as the working directory, so this file — not the repo-root
 * babel.config.js — becomes the Babel root for mfe-app-1 (and for its Jest 30
 * project, whose rootDir is this directory). React 19 ships an automatic JSX
 * runtime, so `react` no longer has to be in scope for every JSX file.
 */
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: "last 2 Chrome versions, last 2 Firefox versions, not dead",
        // Keep ESM for webpack; babel-jest needs CJS.
        modules:
          process.env.BABEL_ENV === "test" || process.env.NODE_ENV === "test" ? "commonjs" : false,
      },
    ],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};
