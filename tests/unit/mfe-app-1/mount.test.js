import { act } from "react";
import { mount } from "../../../mfe-app-1/src/mount";

/**
 * mfe-app-1 runs on React 19.3.1 in this branch. These tests execute inside the
 * React 19 Jest project (Jest 30 + RTL 16), so the `react` the app resolves here is
 * the workspace's own React 19 copy — the assertions below are evidence of the
 * ACTUAL runtime, not of what package.json claims.
 *
 * React 19's `createRoot().render()` schedules work instead of writing the DOM
 * synchronously (React 16's `ReactDOM.render` was synchronous), so the lifecycle
 * calls are flushed with `act` — imported from `react`, which is where React 19
 * moved it (`react-dom/test-utils` was removed).
 */
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("mfe-app-1 mount/unmount contract (React 19)", () => {
  it("mounts through createRoot, reports the React 19 runtime and unmounts (repeatably)", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    let handle;
    await act(async () => {
      handle = mount(el, { origin: "test" });
    });
    expect(el.querySelector('[data-testid="app1-root"]')).toBeInTheDocument();

    const info = handle.getRuntimeInfo();
    expect(info).toEqual({
      reactVersion: "19.3.1",
      reactDomVersion: "19.3.1",
      renderer: "concurrent (createRoot)",
      shareScope: "default",
      identity: {
        react: expect.objectContaining({ role: "react", version: "19.3.1" }),
        reactDom: expect.objectContaining({ role: "react-dom", version: "19.3.1" }),
      },
    });
    expect(info.identity.react.consumers).toContain("mfeApp1");
    // The `react-dom` root and the `react-dom/client` subpath must negotiate to one
    // generation: the reported react-dom version is the renderer's own package version.
    expect(info.identity.reactDom.version).toBe(info.reactDomVersion);

    await act(async () => {
      handle.unmount();
    });
    expect(el.innerHTML).toBe("");

    // Mount again on the same node to prove repeated lifecycle works, and that the
    // scope keeps handing back the very same shared instance.
    let handle2;
    await act(async () => {
      handle2 = mount(el, { origin: "test" });
    });
    expect(el.querySelector('[data-testid="app1-root"]')).toBeInTheDocument();
    expect(handle2.getRuntimeInfo().identity.react.id).toBe(info.identity.react.id);
    await act(async () => {
      handle2.unmount();
    });
    expect(el.innerHTML).toBe("");

    el.remove();
  });

  it("renders with a concurrent root and no legacy ReactDOM.render path", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    let handle;
    await act(async () => {
      handle = mount(el, { origin: "test" });
    });
    // React 19 removed ReactDOM.render; createRoot tags the container with its own
    // internal key instead of the legacy `_reactRootContainer`.
    expect(Object.keys(el).some((key) => key.startsWith("__reactContainer"))).toBe(true);
    expect(el._reactRootContainer).toBeUndefined();
    await act(async () => {
      handle.unmount();
    });
    el.remove();
  });

  it("throws when no element is provided", () => {
    expect(() => mount(null)).toThrow();
  });
});
