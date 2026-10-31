const path = require("path");

// purge globs are resolved relative to process.cwd(), which differs per app
// during a workspace build — use absolute paths so Tailwind always finds sources.
module.exports = {
  purge: {
    // Tailwind v2 auto-enables purge only when process.env.NODE_ENV === "production",
    // but `webpack --mode production` does not set that env var for PostCSS plugins.
    // Force it so shipped bundles contain only the utilities actually used.
    enabled: true,
    content: [
      path.resolve(__dirname, "container-app/src/**/*.{js,jsx}"),
      path.resolve(__dirname, "mfe-app-1/src/**/*.{js,jsx}"),
      path.resolve(__dirname, "mfe-app-2/src/**/*.{js,jsx}"),
      path.resolve(__dirname, "mfe-app-3/src/**/*.{js,jsx}"),
    ],
  },
  darkMode: false,
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
