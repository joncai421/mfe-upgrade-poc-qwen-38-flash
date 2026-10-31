/**
 * Framework-independent mount contract (PRD 2.2).
 *
 * Each micro-frontend calls one of the factories here with ITS OWN React and
 * ReactDOM bindings, so the returned mount()/unmount() always drive that
 * application's runtime — never the container's. This keeps every MFE on its own
 * React root and lets one interface serve both React generations:
 *
 *   createMountContract()      React 16  — ReactDOM.render / unmountComponentAtNode
 *   createRootMountContract()  React 19  — createRoot(...).render / root.unmount()
 *
 * Both return the SAME public surface (mount -> { unmount, isMounted,
 * getRuntimeInfo }), so no container code changes when a remote switches React
 * generation. That is the property the migration is trying to demonstrate.
 *
 * Every mount() call owns its own container reference, so the same exposed module
 * can be mounted in several places (e.g. the diagnostics probe and the active
 * view) and unmounted independently and repeatedly.
 */
const { identify } = require("./runtime-identity");

function describeRuntime(appName, renderer, React, ReactDOM) {
  return {
    reactVersion: React ? React.version : "unknown",
    reactDomVersion: (ReactDOM && ReactDOM.version) || "unknown",
    renderer,
    // Option C: everything runs in the "default" share scope — no named scopes.
    shareScope: "default",
    // Identity, not just version: proves the scope really served this module
    // instead of a local fallback (see shared/runtime-identity.js).
    identity: {
      react: identify(React, "react", appName),
      reactDom: identify(ReactDOM, "react-dom", appName),
    },
  };
}

function createMountContract(React, ReactDOM, renderRoot, options = {}) {
  const appName = options.appName || "unknown-app";

  function mount(element, props = {}) {
    if (!element) {
      throw new Error("mount(element): element is required");
    }
    ReactDOM.render(renderRoot(props, element), element);
    // Join the page-wide runtime census as soon as this application mounts: the
    // evidence must not depend on somebody calling getRuntimeInfo() afterwards.
    describeRuntime(appName, "legacy (ReactDOM.render)", React, ReactDOM);

    let alive = true;
    const unmount = () => {
      if (alive) {
        ReactDOM.unmountComponentAtNode(element);
        alive = false;
      }
    };

    return {
      unmount,
      isMounted: () => alive,
      // Re-derived per call so a late reader sees the current consumer list too.
      getRuntimeInfo: () => describeRuntime(appName, "legacy (ReactDOM.render)", React, ReactDOM),
    };
  }

  // Module-level unmount is not meaningful with per-root handles; the container
  // uses the handle returned from mount(). This export satisfies contract parity.
  const unmount = () => {};

  return { mount, unmount };
}

/**
 * React 18+/19 flavour. `ReactDOMClient` is the `react-dom/client` module, which
 * carries no `.version` export, so the `react-dom` module itself is passed for
 * version/identity reporting: importing it is also what proves the `react-dom`
 * root and the `react-dom/client` subpath negotiate to one single generation.
 */
function createRootMountContract(React, ReactDOMClient, renderRoot, options = {}) {
  const appName = options.appName || "unknown-app";
  const reactDomModule = options.reactDomModule || ReactDOMClient;

  function mount(element, props = {}) {
    if (!element) {
      throw new Error("mount(element): element is required");
    }
    const root = ReactDOMClient.createRoot(element);
    root.render(renderRoot(props, element));
    // Same eager census entry as the React 16 flavour (rendering is scheduled here,
    // but the modules have already been resolved at this point).
    describeRuntime(appName, "concurrent (createRoot)", React, reactDomModule);

    let alive = true;
    const unmount = () => {
      if (alive) {
        alive = false;
        root.unmount();
      }
    };

    return {
      unmount,
      isMounted: () => alive,
      getRuntimeInfo: () =>
        describeRuntime(appName, "concurrent (createRoot)", React, reactDomModule),
    };
  }

  const unmount = () => {};

  return { mount, unmount };
}

module.exports = { createMountContract, createRootMountContract, describeRuntime };
