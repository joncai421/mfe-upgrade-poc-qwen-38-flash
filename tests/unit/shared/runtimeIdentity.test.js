import React from "react";
import ReactDOM from "react-dom";
import {
  REGISTRY_KEY,
  identify,
  summarizePageRuntimes,
  resetPageRuntimeIdentity,
} from "../../../shared/runtime-identity";
import { mount as mountApp2 } from "../../../mfe-app-2/src/mount";
import { mount as mountApp3 } from "../../../mfe-app-3/src/mount";

/**
 * The registry is what turns "the version string looks right" into "the scope
 * really served this module object". A silent local fallback under
 * `singleton: false` would still print 16.14.0 — but it would be a different
 * object, and these tests would see two instances instead of one.
 */
describe("runtime identity registry", () => {
  beforeEach(() => {
    resetPageRuntimeIdentity();
  });

  it("gives one module object a single id, shared by every consumer", () => {
    const first = identify(React, "react", "appA");
    const second = identify(React, "react", "appB");
    expect(first.id).toBe(second.id);
    expect(second.consumers).toEqual(["appA", "appB"]);
    expect(first.version).toBe("16.14.0");
  });

  it("counts two module objects as two instances", () => {
    const one = identify({}, "react", "appA");
    const two = identify({}, "react", "appB");
    expect(one.id).not.toBe(two.id);
    expect(summarizePageRuntimes().reactInstances).toHaveLength(2);
  });

  it("keeps react and react-dom counts separate", () => {
    identify(React, "react", "appA");
    identify(ReactDOM, "react-dom", "appA");
    const summary = summarizePageRuntimes();
    expect(summary.reactInstances).toHaveLength(1);
    expect(summary.reactDomInstances).toHaveLength(1);
    expect(summary.distinctReactVersions).toEqual(["16.14.0"]);
    expect(summary.scopeName).toBe("default");
  });

  it("reports a single shared React 16 instance for the two React 16 remotes", () => {
    const el2 = document.createElement("div");
    const el3 = document.createElement("div");
    document.body.appendChild(el2);
    document.body.appendChild(el3);

    const handle2 = mountApp2(el2, { origin: "test" });
    const handle3 = mountApp3(el3, { origin: "test" });

    const identity2 = handle2.getRuntimeInfo().identity.react;
    const identity3 = handle3.getRuntimeInfo().identity.react;
    expect(identity2.id).toBe(identity3.id);
    expect(identity3.consumers).toEqual(expect.arrayContaining(["mfeApp2", "mfeApp3"]));
    expect(summarizePageRuntimes().reactInstances).toHaveLength(1);

    handle2.unmount();
    handle3.unmount();
    el2.remove();
    el3.remove();
  });

  it("stores the registry on the page global, not on this module's copy", () => {
    identify(React, "react", "appA");
    // Every build bundles its own copy of shared/runtime-identity.js; the registry
    // has to live on the page so cross-application comparison works at all.
    expect(globalThis[REGISTRY_KEY]).toBeDefined();
    expect(globalThis[REGISTRY_KEY].instances).toHaveLength(1);
  });
});
