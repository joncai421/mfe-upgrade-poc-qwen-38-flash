import { REMOTE_APPS } from "../../../container-app/src/remotes/registry";

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
});
