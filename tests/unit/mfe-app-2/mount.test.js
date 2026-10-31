import { mount } from "../../../mfe-app-2/src/mount";

describe("mfe-app-2 mount/unmount contract", () => {
  it("mounts with React 16 runtime info and unmounts cleanly", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const handle = mount(el, { origin: "test" });
    expect(el.querySelector('[data-testid="app2-root"]')).toBeInTheDocument();
    const info = handle.getRuntimeInfo();
    expect(info.reactVersion).toBe("16.14.0");
    // Option C keeps the React 16 apps on the plain legacy renderer inside the
    // SAME default scope as the React 19 app — the contract shape is shared.
    expect(info.renderer).toBe("legacy (ReactDOM.render)");
    expect(info.shareScope).toBe("default");
    expect(info.identity.react.role).toBe("react");
    handle.unmount();
    expect(el.innerHTML).toBe("");
    el.remove();
  });
});
