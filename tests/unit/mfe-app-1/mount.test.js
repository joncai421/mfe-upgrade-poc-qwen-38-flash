import { act } from "react";
import { mount } from "../../../mfe-app-1/src/mount";

// Option B: this project runs against React 19.3.1 resolved from mfe-app-1's own
// workspace tree. React 19 removed ReactDOM.render, so mount() creates a
// concurrent root — renders and unmounts are therefore flushed inside act().
describe("mfe-app-1 mount/unmount contract (React 19)", () => {
  it("mounts, reports the React 19 runtime and unmounts (repeatably)", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    let handle;
    await act(async () => {
      handle = mount(el, { origin: "test" });
    });
    expect(el.querySelector('[data-testid="app1-root"]')).toBeInTheDocument();
    expect(handle.getRuntimeInfo()).toEqual({
      reactVersion: "19.3.1",
      reactDomVersion: "19.3.1",
      renderer: "react-dom/client:createRoot",
      shareScope: "react19",
      // No container tagged this React instance: it is a runtime of its own.
      runtimeTag: null,
    });

    await act(async () => {
      handle.unmount();
    });
    expect(el.innerHTML).toBe("");

    // Mount again on the same node to prove repeated lifecycle works.
    let handle2;
    await act(async () => {
      handle2 = mount(el, { origin: "test" });
    });
    expect(el.querySelector('[data-testid="app1-root"]')).toBeInTheDocument();
    await act(async () => {
      handle2.unmount();
    });
    expect(el.innerHTML).toBe("");

    el.remove();
  });

  it("keeps two concurrent roots independent, each on its own React 19 root", async () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    document.body.append(a, b);

    let ha;
    let hb;
    await act(async () => {
      ha = mount(a, { origin: "test-a" });
      hb = mount(b, { origin: "test-b" });
    });
    expect(a.querySelector('[data-testid="app1-root"]')).toBeInTheDocument();
    expect(b.querySelector('[data-testid="app1-root"]')).toBeInTheDocument();
    expect(ha.getRuntimeInfo().reactVersion).toBe(hb.getRuntimeInfo().reactVersion);

    await act(async () => {
      ha.unmount();
    });
    // Unmounting one root must leave the other mounted and rendering.
    expect(a.innerHTML).toBe("");
    expect(b.querySelector('[data-testid="app1-root"]')).toBeInTheDocument();

    await act(async () => {
      hb.unmount();
    });
    expect(b.innerHTML).toBe("");
    a.remove();
    b.remove();
  });

  it("throws when no element is provided", () => {
    expect(() => mount(null)).toThrow();
  });
});
