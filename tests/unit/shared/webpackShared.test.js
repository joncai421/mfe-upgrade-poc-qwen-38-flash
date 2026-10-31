const path = require("path");
const fs = require("fs");
const { ModuleFederationPlugin } = require("webpack").container;
const {
  REACT_16_VERSION,
  REACT_19_VERSION,
  createConfig,
} = require("../../../shared/webpack.base");

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const SHARED_KEYS = ["react", "react-dom", "react/", "react-dom/"];

function loadConfig(workspace) {
  // Absolute path: the configs are plain CommonJS modules outside this test's tree.
  return require(path.resolve(repoRoot, workspace, "webpack.config.js"));
}

function federationOptions(workspace) {
  const config = loadConfig(workspace);
  const plugin = config.plugins.find((p) => p instanceof ModuleFederationPlugin);
  if (!plugin) {
    throw new Error(`${workspace}: no ModuleFederationPlugin`);
  }
  return { config, options: plugin.options };
}

// The alias values are package roots, so the manifest sits directly inside them.
function manifestAt(packageRoot) {
  return JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"));
}

/**
 * Option C is defined by what these assertions check: ONE scope (the default),
 * two generations allowed (`singleton: false`), generation-specific
 * `requiredVersion`, `strictVersion: true`, no named scopes, no custom shareKeys,
 * subpath sharing consistent with the package root, and local fallbacks intact.
 */
describe("Option C webpack sharing (default scope, multiple React versions)", () => {
  const GENERATIONS = {
    "container-app": REACT_16_VERSION,
    "mfe-app-1": REACT_19_VERSION,
    "mfe-app-2": REACT_16_VERSION,
    "mfe-app-3": REACT_16_VERSION,
  };

  Object.entries(GENERATIONS).forEach(([workspace, version]) => {
    describe(workspace, () => {
      const { config, options } = federationOptions(workspace);

      it("shares react and react-dom (plus subpaths) from the default scope only", () => {
        expect(Object.keys(options.shared).sort()).toEqual([...SHARED_KEYS].sort());
        // No top-level shareScope => webpack registers/consumes under "default".
        expect(options.shareScope).toBeUndefined();
        Object.values(options.shared).forEach((entry) => {
          expect(entry.shareScope).toBeUndefined();
          // No custom shareKey either: the lookup keys are the package names.
          expect(entry.shareKey).toBeUndefined();
        });
      });

      it("allows multiple versions but pins each consumer to its own generation", () => {
        SHARED_KEYS.forEach((key) => {
          expect(options.shared[key]).toEqual({
            singleton: false,
            requiredVersion: `^${version}`,
            strictVersion: true,
            version,
          });
        });
      });

      it("keeps eager off and local fallbacks available", () => {
        SHARED_KEYS.forEach((key) => {
          expect(options.shared[key].eager).toBeFalsy();
          expect(options.shared[key].fallback).not.toBe(false);
        });
      });

      it("resolves react/react-dom to the generation this build declares", () => {
        // Guards the npm-workspaces hoisting leak: a require("react") from any
        // module in this compilation must land on this build's own generation.
        const reactManifest = manifestAt(config.resolve.alias.react);
        const reactDomManifest = manifestAt(config.resolve.alias["react-dom"]);
        expect(reactManifest.name).toBe("react");
        expect(reactDomManifest.name).toBe("react-dom");
        expect(reactManifest.version).toBe(version);
        expect(reactDomManifest.version).toBe(version);
      });

      it("declares that generation in package.json too", () => {
        const manifest = JSON.parse(
          fs.readFileSync(path.resolve(repoRoot, workspace, "package.json"), "utf8")
        );
        expect(manifest.dependencies.react).toBe(version);
        expect(manifest.dependencies["react-dom"]).toBe(version);
      });
    });
  });

  it("has exactly one build on React 19 — the rest stay on React 16", () => {
    const upgraded = Object.entries(GENERATIONS).filter(([, v]) => v === REACT_19_VERSION).map(([w]) => w);
    expect(upgraded).toEqual(["mfe-app-1"]);
  });

  it("initializes remotes through the default scope (string externals, no shareScope objects)", () => {
    const { options } = federationOptions("container-app");
    expect(typeof options.remotes.mfeApp1).toBe("string");
    expect(options.remotes.mfeApp1).toBe("mfeApp1@http://localhost:3001/remoteEntry.js");
    Object.values(options.remotes).forEach((remote) => {
      expect(typeof remote).toBe("string");
    });
  });

  it("gives every build a unique output.uniqueName", () => {
    const names = Object.keys(GENERATIONS).map((workspace) => {
      const { config } = federationOptions(workspace);
      return config.output.uniqueName;
    });
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(["containerApp", "mfeApp1", "mfeApp2", "mfeApp3"]);
  });

  it("refuses an unknown React generation", () => {
    expect(() =>
      createConfig({ dir: repoRoot, name: "sandbox", port: 4000, reactVersion: "18.3.1" })
    ).toThrow(/unsupported reactVersion/);
  });
});
