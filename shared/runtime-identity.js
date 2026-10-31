/**
 * Runtime identity probes (evidence for PRD 6.4 / 6.6).
 *
 * A version string alone cannot prove that Module Federation sharing actually
 * happened: under `singleton: false` a silent local fallback would still report
 * "16.14.0" and every version-based assertion would pass. These helpers therefore
 * identify the resolved MODULE OBJECT, so two applications can prove they run the
 * very same React instance — or that two generations deliberately do not.
 *
 * The registry lives on the page global on purpose: every build bundles its own
 * copy of this file (it is a local module, never a shared one), while the React
 * module object is shared only if the default scope really served it. Comparing
 * object identity across those two worlds is exactly what makes the check
 * meaningful. WeakMap keys add no lifetime constraint beyond the page itself.
 *
 * Nothing here crosses an application boundary except plain data (ids, version
 * strings, name lists) — no React elements, contexts or hooks are shared.
 */
const REGISTRY_KEY = "__mfeRuntimeIdentity__";

function pageGlobal() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  return {};
}

function getState() {
  const target = pageGlobal();
  if (!target[REGISTRY_KEY]) {
    target[REGISTRY_KEY] = { seq: 0, byModule: new WeakMap(), instances: [] };
  }
  return target[REGISTRY_KEY];
}

function publicRecord(record) {
  return {
    id: record.id,
    role: record.role,
    version: record.version,
    consumers: record.consumers.slice(),
  };
}

/**
 * Register (or look up) the identity of one resolved module instance.
 *
 * @param {object} resolvedModule the module object this application actually got
 * @param {"react"|"react-dom"} role
 * @param {string} appName  build name, e.g. "containerApp"
 * @param {string} [version]
 */
function identify(resolvedModule, role, appName, version) {
  if (!resolvedModule) {
    return { id: `${role}-unknown`, role, version: version || "unknown", consumers: [appName] };
  }
  const state = getState();
  let record = state.byModule.get(resolvedModule);
  if (!record) {
    state.seq += 1;
    record = {
      id: `${role}-${state.seq}`,
      role,
      version: version || resolvedModule.version || "unknown",
      consumers: [],
    };
    state.byModule.set(resolvedModule, record);
    state.instances.push(record);
  }
  if (appName && record.consumers.indexOf(appName) === -1) {
    record.consumers.push(appName);
  }
  return publicRecord(record);
}

/** Page-wide view of every React / React DOM instance that reported in. */
function summarizePageRuntimes() {
  const state = getState();
  const react = state.instances.filter((i) => i.role === "react").map(publicRecord);
  const reactDom = state.instances.filter((i) => i.role === "react-dom").map(publicRecord);
  return {
    reactInstances: react,
    reactDomInstances: reactDom,
    distinctReactVersions: Array.from(new Set(react.map((i) => i.version))).sort(),
    scopeName: "default",
  };
}

/** Test seam: unit tests create their own jsdom page state and must not leak it. */
function resetPageRuntimeIdentity() {
  const state = getState();
  state.seq = 0;
  state.byModule = new WeakMap();
  state.instances = [];
  return state;
}

module.exports = {
  REGISTRY_KEY,
  identify,
  identifyReact: (React, appName) => identify(React, "react", appName),
  identifyReactDOM: (ReactDOM, appName) => identify(ReactDOM, "react-dom", appName),
  summarizePageRuntimes,
  resetPageRuntimeIdentity,
};
