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
 * Option C sharing: ONE default share scope, multiple React generations.
 *
 * Rules applied here (PRD 6.3):
 *   - no `shareScope` names anywhere -> webpack uses the "default" scope for both
 *     providers and consumers;
 *   - no custom `shareKey` -> react and react-dom keep their package names;
 *   - `singleton: false` -> two versions may be registered under the same key;
 *   - `requiredVersion` is generation-specific, so a React 16 consumer can never
 *     negotiate onto a 19 provider and vice versa;
 *   - `strictVersion: true` -> if no satisfying provider exists the consumer fails
 *     loudly instead of silently carrying on with an incompatible one;
 *   - `version` is pinned so the version a build *provides* into the scope is
 *     explicit instead of depending on where npm happened to hoist the package;
 *   - local fallbacks are NOT disabled (no `fallback: false`), so each app still
 *     builds and runs standalone.
 */
const REACT_16_VERSION = "16.14.0";
const REACT_19_VERSION = "19.3.1";

function sharedReactForVersion(version) {
  const constraint = {
    singleton: false,
    requiredVersion: `^${version}`,
    strictVersion: true,
    version,
  };
  // Package roots and subpath imports must negotiate identically, otherwise
  // `react` and `react/jsx-runtime` (or `react-dom` and `react-dom/client`)
  // could resolve to different generations inside the same application.
  return {
    react: { ...constraint },
    "react-dom": { ...constraint },
    "react/": { ...constraint },
    "react-dom/": { ...constraint },
  };
}

const SHARED_REACT_16 = sharedReactForVersion(REACT_16_VERSION);
const SHARED_REACT_19 = sharedReactForVersion(REACT_19_VERSION);

const SHARED_BY_REACT_VERSION = {
  [REACT_16_VERSION]: SHARED_REACT_16,
  [REACT_19_VERSION]: SHARED_REACT_19,
};

/**
 * Resolve a package the way this build's own dependency tree would, so a require
 * can never land on another React generation.
 *
 * Why this is needed (found while building Option C): npm workspaces hoist
 * packages that all workspaces agree on, so `react-router-dom` and
 * `use-sync-external-store` live in the REPO ROOT node_modules. Their internal
 * `require("react")` therefore resolves from the root context — i.e. to React 16
 * — even inside the React 19 build. Webpack then bundled that foreign copy as a
 * local fallback AND registered it as a provider, which under a pinned
 * `version: "19.3.1"` appeared in the default scope as `react@19.3.1 =
 * ../node_modules/react/index.js` (a mislabeled React 16 provider). Aliasing the
 * two package roots to the generation this build declares closes the leak, while
 * leaving the requests as plain "react"/"react-dom" so Module Federation still
 * recognises them and serves them from the shared scope
 * (webpack matches module requests unresolved — see ConsumeSharedPlugin).
 */
function resolvePackageRoot(fromDir, packageName) {
  return path.dirname(require.resolve(packageName, { paths: [fromDir] }));
}

function reactAliasFor(dir) {
  return {
    react: resolvePackageRoot(dir, "react"),
    "react-dom": resolvePackageRoot(dir, "react-dom"),
  };
}

function createConfig({
  dir,
  name,
  port,
  filename,
  remotes,
  exposes,
  reactVersion = REACT_16_VERSION,
}) {
  const isProd = process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test";
  const mode = isProd ? "production" : "development";
  const shared = SHARED_BY_REACT_VERSION[reactVersion];

  if (!shared) {
    throw new Error(
      `createConfig(): unsupported reactVersion "${reactVersion}" (known: ${Object.keys(
        SHARED_BY_REACT_VERSION
      ).join(", ")})`
    );
  }

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
      alias: reactAliasFor(dir),
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
        // No top-level `shareScope` option: Option C keeps every build on the
        // "default" scope and lets version negotiation do the separation.
        shared,
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

module.exports = {
  createConfig,
  sharedReactForVersion,
  SHARED_REACT_16,
  SHARED_REACT_19,
  SHARED_BY_REACT_VERSION,
  REACT_16_VERSION,
  REACT_19_VERSION,
};
