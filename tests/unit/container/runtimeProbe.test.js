import { tagReactInstance, readReactInstanceTag, getProbeToken } from "../../../shared/scope-probe";
import { sharesContainerRuntime } from "../../../container-app/src/utils/runtimeProbe";

// The probe is what lets the Option B diagnostics prove that a remote really run
// the SAME React instance as the container (same share scope) instead of just
// reporting a matching version string.
describe("share-scope runtime probe", () => {
  it("tags a React instance and reads the tag back", () => {
    const react = { version: "16.14.0" };
    const token = tagReactInstance(react, "react16");
    expect(readReactInstanceTag(react)).toEqual({ shareScope: "react16", token });
  });

  it("keeps the first tagger's token (the container tags before any remote loads)", () => {
    const react = { version: "16.14.0" };
    const containerToken = tagReactInstance(react, "react16");
    tagReactInstance(react, "otherScope");
    expect(readReactInstanceTag(react).token).toBe(containerToken);
  });

  it("returns null for an instance nobody tagged (a runtime of its own)", () => {
    const react19 = { version: "19.3.1" };
    expect(readReactInstanceTag(react19)).toBeNull();
  });

  it("classifies what a remote reports", () => {
    // No runtimeTag field at all => remote predates the probe.
    expect(sharesContainerRuntime(null)).toBe("unknown");
    expect(sharesContainerRuntime({ reactVersion: "16.14.0" })).toBe("unknown");
    // Tagged by this (container) bundle => same React instance.
    expect(
      sharesContainerRuntime({ runtimeTag: { shareScope: "react16", token: getProbeToken() } })
    ).toBe("yes");
    // Untagged or tagged elsewhere => a different instance.
    expect(sharesContainerRuntime({ runtimeTag: null })).toBe("no");
    expect(sharesContainerRuntime({ runtimeTag: { shareScope: "x", token: "other" } })).toBe("no");
  });
});
