import { REMOTE_APPS, CONTAINER_SHARE_SCOPE } from "../../../container-app/src/remotes/registry";

describe("container remote registry", () => {
  it("registers exactly three remotes with unique ids and paths", () => {
    expect(REMOTE_APPS).toHaveLength(3);
    const ids = REMOTE_APPS.map((r) => r.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids).toEqual(["mfeApp1", "mfeApp2", "mfeApp3"]);
    expect(REMOTE_APPS.map((r) => r.path)).toEqual(["/app1", "/app2", "/app3"]);
  });

  it("each remote exposes a load() function", () => {
    REMOTE_APPS.forEach((r) => expect(typeof r.load).toBe("function"));
  });

  // Option B: the registry declares which share scope each remote belongs to.
  // This must mirror the `remotes` object in container-app/webpack.config.js, and
  // the expectation is verified against the ACTUAL runtime by the integration and
  // E2E react-version suites (the registry value is never treated as proof).
  it("declares one scope per React generation: App 1 on react19, Apps 2/3 on react16", () => {
    expect(CONTAINER_SHARE_SCOPE).toBe("react16");
    expect(REMOTE_APPS.map((r) => r.shareScope)).toEqual(["react19", "react16", "react16"]);
    expect(REMOTE_APPS.map((r) => r.expectedReact)).toEqual(["19.3.1", "16.14.0", "16.14.0"]);
  });
});
