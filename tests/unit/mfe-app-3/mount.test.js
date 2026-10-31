import { mount } from "../../../mfe-app-3/src/mount";

describe("mfe-app-3 mount/unmount contract", () => {
  it("mounts, reports React 16 runtime, and unmounts repeatedly", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const h1 = mount(el, { origin: "test" });
    expect(el.querySelector('[data-testid="app3-root"]')).toBeInTheDocument();
    // Full contract shape (Option C adds renderer/scope/identity diagnostics).
    expect(h1.getRuntimeInfo()).toEqual({
      reactVersion: "16.14.0",
      reactDomVersion: "16.14.0",
      renderer: "legacy (ReactDOM.render)",
      shareScope: "default",
      identity: {
        react: expect.objectContaining({
          role: "react",
          version: "16.14.0",
          consumers: ["mfeApp3"],
        }),
        reactDom: expect.objectContaining({ role: "react-dom", version: "16.14.0" }),
      },
    });
    h1.unmount();
    expect(el.innerHTML).toBe("");

    const h2 = mount(el, { origin: "test" });
    expect(el.querySelector('[data-testid="app3-root"]')).toBeInTheDocument();
    expect(h2.getRuntimeInfo().identity.react.id).toBe(h1.getRuntimeInfo().identity.react.id);
    h2.unmount();

    el.remove();
  });
});
