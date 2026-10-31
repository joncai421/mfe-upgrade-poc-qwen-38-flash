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

const SHARED_REACT_BASELINE = {
  react: {
    singleton: true,
    requiredVersion: "^16.14.0",
  },
  "react-dom": {
    singleton: true,
    requiredVersion: "^16.14.0",
  },
  // Subpath sharing (trailing-slash syntax). React 16 + classic JSX runtime does not
  // import react/jsx-runtime today; these entries keep the contract correct for the
  // React 19 migration phases without changing the baseline sharing behaviour.
  "react/": {
    singleton: true,
    requiredVersion: "^16.14.0",
  },
  "react-dom/": {
    singleton: true,
    requiredVersion: "^16.14.0",
  },
};

function createConfig({ dir, name, port, filename, remotes, exposes }) {
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
        ...(filename ? { filename } : {}),
        ...(remotes ? { remotes } : {}),
        ...(exposes ? { exposes } : {}),
        shared: SHARED_REACT_BASELINE,
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

module.exports = { createConfig, SHARED_REACT_BASELINE };
