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
    // React 16 has no automatic JSX runtime; classic transform requires React in scope.
    ["@babel/preset-react", { runtime: "classic" }],
  ],
};
