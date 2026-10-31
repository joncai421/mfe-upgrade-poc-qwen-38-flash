import { mount } from "../../../mfe-app-3/src/mount";

describe("mfe-app-3 mount/unmount contract", () => {
  it("mounts, reports React 16 runtime, and unmounts repeatedly", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const h1 = mount(el, { origin: "test" });
    expect(el.querySelector('[data-testid="app3-root"]')).toBeInTheDocument();
    expect(h1.getRuntimeInfo()).toEqual({ reactVersion: "16.14.0", reactDomVersion: "16.14.0" });
    h1.unmount();
    expect(el.innerHTML).toBe("");

    const h2 = mount(el, { origin: "test" });
    expect(el.querySelector('[data-testid="app3-root"]')).toBeInTheDocument();
    h2.unmount();

    el.remove();
  });
});
