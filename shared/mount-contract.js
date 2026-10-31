/**
 * Framework-independent mount contract (PRD 2.2).
 *
 * Each micro-frontend calls createMountContract() with ITS OWN React and
 * ReactDOM bindings, so the returned mount()/unmount() always drive that
 * application's runtime — never the container's. This keeps every MFE on its
 * own React root and lets the mount interface be reused unchanged across the
 * React 16 baseline and both React 19 upgrade branches.
 *
 * Two rendering back-ends are supported, selected by what the passed ReactDOM
 * binding exposes — the contract's own public surface stays identical either way:
 *
 *   React 16   ReactDOM.render(element, node) / ReactDOM.unmountComponentAtNode(node)
 *   React 19   react-dom/client createRoot(node).render(element) / root.unmount()
 *
 * `ReactDOM.render`, `ReactDOM.unmountComponentAtNode` and `ReactDOM.hydrate`
 * were removed in React 19, so React 19 apps pass the `react-dom/client`
 * binding (`createRoot`) instead. `meta` carries the extra runtime facts the
 * React 16 binding used to expose itself (react-dom `version`, share scope).
 *
 * Every mount() call owns its own root reference, so the same exposed module can
 * be mounted in several places (e.g. the diagnostics probe and the active view)
 * and unmounted independently and repeatedly.
 */
const { readReactInstanceTag } = require("./scope-probe");

function createMountContract(React, ReactDOM, renderRoot, meta = {}) {
  const usesClientRoot = typeof ReactDOM.createRoot === "function";

  function mount(element, props = {}) {
    if (!element) {
      throw new Error("mount(element): element is required");
    }

    let alive = true;
    let unmount;

    if (usesClientRoot) {
      // React 18/19 concurrent root. `root.unmount()` synchronously detaches the
      // tree and releases the root's resources.
      const root = ReactDOM.createRoot(element);
      root.render(renderRoot(props, element));
      unmount = () => {
        if (alive) {
          root.unmount();
          alive = false;
        }
      };
    } else {
      // React 16 legacy rendering API.
      ReactDOM.render(renderRoot(props, element), element);
      unmount = () => {
        if (alive) {
          ReactDOM.unmountComponentAtNode(element);
          alive = false;
        }
      };
    }

    return {
      unmount,
      isMounted: () => alive,
      getRuntimeInfo: () => ({
        reactVersion: React.version,
        reactDomVersion: meta.reactDomVersion || ReactDOM.version,
        // Declared wiring for this application; the versions above are runtime facts.
        renderer: usesClientRoot ? "react-dom/client:createRoot" : "react-dom:render",
        shareScope: meta.shareScope || "default",
        // Identity evidence: the tag written by whichever application tagged the
        // React INSTANCE this application actually resolved (null = an instance
        // nobody else tagged, i.e. a runtime of its own).
        runtimeTag: readReactInstanceTag(React),
      }),
    };
  }

  // Module-level unmount is not meaningful with per-root handles; the container
  // uses the handle returned from mount(). This export satisfies contract parity.
  const unmount = () => {};

  return { mount, unmount };
}

module.exports = { createMountContract };
