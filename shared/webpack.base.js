/**
 * Shared Webpack 5 + Module Federation configuration factory.
 * Each application calls createConfig() from its own webpack.config.js
 * and stays independently buildable/runnable.
 */
const path = require("path");
const webpack = require("webpack");
const { ModuleFederationPlugin } = require("webpack").container;
const HtmlWebpackPlugin = require("html-webpack-plugin");
const dotenv = require("dotenv");

// Remote URLs are centralised in .env (see .env.example) — never hardcoded in app code.
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

/**
 * Option B — two independent Module Federation share scopes.
 *
 * `react16` carries the React 16 singleton consumed by the container, App 2 and
 * App 3; `react19` carries the React 19 singleton consumed by App 1. Both live
 * on the same browser page without ever resolving each other's React, because a
 * consumer only looks inside its own `shareScope`.
 *
 * `singleton: true` is retained WITHIN each scope (PRD 5.3), and
 * `strictVersion: true` makes a cross-generation lookup fail loudly instead of
 * silently rendering with an incompatible runtime.
 *
 * `version` is pinned explicitly rather than inferred from the build context so
 * each build registers the version it really provides into its own scope.
 */
const REACT16 = {
  label: "react16",
  shareScope: "react16",
  version: "16.14.0",
  requiredVersion: "^16.14.0",
};

const REACT19 = {
  label: "react19",
  shareScope: "react19",
  version: "19.3.1",
  requiredVersion: "^19.3.1",
};

/**
 * Builds the `shared` map for one React generation.
 *
 * Package-root sharing (`react`, `react-dom`) plus trailing-slash subpath
 * sharing (`react/`, `react-dom/`) so `react/jsx-runtime` (automatic JSX
 * runtime, React 19 app) and `react-dom/client` (createRoot) resolve through the
 * same scope as their parent package (PRD 5.3).
 *
 * NOTE: the per-dependency `shareScope` below is NOT the whole story. A remote
 * also has to declare the top-level `shareScope` option (see createConfig) — the
 * scope name its container entry binds the host's map to. Without it a remote
 * registers its providers into "default" while its consumers look inside
 * "react16"/"react19", and every app silently falls back to its own React copy.
 */
function createReactShared({ shareScope, version, requiredVersion }) {
  const options = {
    singleton: true,
    requiredVersion,
    strictVersion: true,
    shareScope,
    version,
  };
  return {
    react: { ...options },
    "react-dom": { ...options },
    "react/": { ...options },
    "react-dom/": { ...options },
  };
}

function createConfig({ dir, name, port, filename, remotes, exposes, react = REACT16 }) {
  const isProd = process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test";
  const mode = isProd ? "production" : "development";

  return {
    mode,
    devtool: isProd ? "source-map" : "eval-cheap-module-source-map",
    entry: path.resolve(dir, "src", "index.js"),
    output: {
      path: path.resolve(dir, "dist"),
      publicPath: "auto",
      clean: true,
      // Each build needs a unique output.uniqueName (webpack 5 default is the package name,
      // which npm workspaces make unique; set it explicitly for clarity).
      uniqueName: name,
    },
    resolve: {
      extensions: [".js", ".jsx"],
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: { cacheDirectory: true, rootMode: "upward" },
          },
        },
        {
          test: /\.css$/,
          use: [
            "style-loader",
            "css-loader",
            {
              loader: "postcss-loader",
              options: {
                // Force the repo-root PostCSS/Tailwind config so `purge` applies
                // regardless of which app directory webpack is invoked from.
                postcssOptions: {
                  config: path.resolve(__dirname, "..", "postcss.config.js"),
                },
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.REMOTE_APP1_URL": JSON.stringify(
          process.env.REMOTE_APP1_URL || "http://localhost:3001/remoteEntry.js"
        ),
        "process.env.REMOTE_APP2_URL": JSON.stringify(
          process.env.REMOTE_APP2_URL || "http://localhost:3002/remoteEntry.js"
        ),
        "process.env.REMOTE_APP3_URL": JSON.stringify(
          process.env.REMOTE_APP3_URL || "http://localhost:3003/remoteEntry.js"
        ),
      }),
      new ModuleFederationPlugin({
        name,
        // Scope this build shares with the host. It must equal the shareScope used
        // by every shared dependency of the application (react.shareScope),
        // otherwise the host's scope map lands under "default" and is never read.
        ...(exposes ? { shareScope: react.shareScope } : {}),
        ...(filename ? { filename } : {}),
        ...(remotes ? { remotes } : {}),
        ...(exposes ? { exposes } : {}),
        shared: createReactShared(react),
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(dir, "public", "index.html"),
        title: name,
      }),
    ],
    devServer: {
      port,
      hot: true,
      headers: {
        // Required so the container (different origin) can fetch remoteEntry.js and chunks.
        "Access-Control-Allow-Origin": "*",
      },
      allowedHosts: "all",
      client: { overlay: { errors: true, warnings: false } },
      static: { directory: path.resolve(dir, "dist") },
    },
    performance: { hints: false },
  };
}

module.exports = { createConfig, createReactShared, REACT16, REACT19 };
