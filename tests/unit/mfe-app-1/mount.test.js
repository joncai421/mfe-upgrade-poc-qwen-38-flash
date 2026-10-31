import { mount } from "../../../mfe-app-1/src/mount";

describe("mfe-app-1 mount/unmount contract", () => {
  it("mounts, reports React 16 runtime and unmounts (repeatably)", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const handle = mount(el, { origin: "test" });
    expect(el.querySelector('[data-testid="app1-root"]')).toBeInTheDocument();
    expect(handle.getRuntimeInfo()).toEqual({
      reactVersion: "16.14.0",
      reactDomVersion: "16.14.0",
    });

    handle.unmount();
    expect(el.innerHTML).toBe("");

    // Mount again on the same node to prove repeated lifecycle works.
    const handle2 = mount(el, { origin: "test" });
    expect(el.querySelector('[data-testid="app1-root"]')).toBeInTheDocument();
    handle2.unmount();
    expect(el.innerHTML).toBe("");

    el.remove();
  });

  it("throws when no element is provided", () => {
    expect(() => mount(null)).toThrow();
  });
});
