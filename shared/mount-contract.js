/**
 * Framework-independent mount contract (PRD 2.2).
 *
 * Each micro-frontend calls createMountContract() with ITS OWN React and
 * ReactDOM bindings, so the returned mount()/unmount() always drive that
 * application's runtime — never the container's. This keeps every MFE on its
 * own React root and lets the mount interface be reused unchanged in the
 * React 19 upgrade branches.
 *
 * React 16 uses ReactDOM.render / ReactDOM.unmountComponentAtNode.
 *
 * Every mount() call owns its own container reference, so the same exposed
 * module can be mounted in several places (e.g. the diagnostics probe and the
 * active view) and unmounted independently and repeatedly.
 */
function createMountContract(React, ReactDOM, renderRoot) {
  function mount(element, props = {}) {
    if (!element) {
      throw new Error("mount(element): element is required");
    }
    ReactDOM.render(renderRoot(props, element), element);

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
      getRuntimeInfo: () => ({
        reactVersion: React.version,
        reactDomVersion: ReactDOM.version,
      }),
    };
  }

  // Module-level unmount is not meaningful with per-root handles; the container
  // uses the handle returned from mount(). This export satisfies contract parity.
  const unmount = () => {};

  return { mount, unmount };
}

module.exports = { createMountContract };
