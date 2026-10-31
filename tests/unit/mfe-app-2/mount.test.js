import { mount } from "../../../mfe-app-2/src/mount";

describe("mfe-app-2 mount/unmount contract", () => {
  it("mounts with React 16 runtime info and unmounts cleanly", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const handle = mount(el, { origin: "test" });
    expect(el.querySelector('[data-testid="app2-root"]')).toBeInTheDocument();
    expect(handle.getRuntimeInfo().reactVersion).toBe("16.14.0");
    handle.unmount();
    expect(el.innerHTML).toBe("");
    el.remove();
  });
});
