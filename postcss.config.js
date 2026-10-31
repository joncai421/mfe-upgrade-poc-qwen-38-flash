const path = require("path");

module.exports = {
  // Tailwind CSS 2.2 requires autoprefixer 10 + postcss 8 as peer dependencies
  // (the PRD's candidate tailwindcss@2.0.4 + postcss@7 combination is not installable;
  // deviation documented in docs/dependency-management.md).
  plugins: {
    // Explicit config path so `purge` is applied regardless of build CWD.
    tailwindcss: path.resolve(__dirname, "tailwind.config.js"),
    autoprefixer: {},
  },
};
