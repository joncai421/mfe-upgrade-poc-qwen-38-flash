const { test, expect } = require("@playwright/test");
const { watchErrors, readPageRuntimes } = require("../../helpers");
const {
  APPS,
  REACT_16_VERSION,
  REACT_19_VERSION,
  REACT_16_APPS,
  REMOTE_IDS,
} = require("../../expectations");

// PRD 6.6 (1)-(2): all four builds participate in the ONE default share scope, and
// both React generations are registered inside it. Evidence comes from three sides:
// the shipped federation artifacts (no named scope anywhere), the containers actually
// initialised in the page, and the instances the applications resolved.
const REMOTE_ENTRY = { mfeApp1: 3001, mfeApp2: 3002, mfeApp3: 3003 };

test.describe("share-scope-initialization (Option C)", () => {
  test("no remoteEntry registers a named react16/react19 scope", async ({ request }) => {
    for (const [name, port] of Object.entries(REMOTE_ENTRY)) {
      const response = await request.get(`http://localhost:${port}/remoteEntry.js`);
      expect(response.status()).toBe(200);
      const source = await response.text();

      // Option C keeps the webpack default: the scope name that appears is "default".
      expect(source).toMatch(/default/);
      expect(source).not.toMatch(/["']react16["']/);
      expect(source).not.toMatch(/["']react19["']/);

      // Each build provides exactly its own generation into that scope, and nothing
      // from the other generation (no cross-registration inside a federation entry).
      const expectedVersion = name === "mfeApp1" ? REACT_19_VERSION : REACT_16_VERSION;
      const otherVersion = expectedVersion === REACT_19_VERSION ? REACT_16_VERSION : REACT_19_VERSION;
      expect(source).toContain(expectedVersion);
      expect(source).not.toContain(otherVersion);
    }
  });

  test("the host initialises its own React 16 before any remote is loaded", async ({ page }) => {
    const { errors, failedRequests } = watchErrors(page);
    await page.goto("/");

    // Default route mounts App 1 (React 19), so by the time this resolves the host
    // has already consumed + provided React 16 in the same default scope.
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 20000 });
    await expect(page.getByTestId("app1-root")).toBeVisible();

    const runtimes = await readPageRuntimes(page);
    const hostInstance = runtimes.react.find((instance) => instance.consumers.includes("containerApp"));
    expect(hostInstance.version).toBe(REACT_16_VERSION);

    const app1Instance = runtimes.react.find((instance) => instance.consumers.includes("mfeApp1"));
    expect(app1Instance.version).toBe(REACT_19_VERSION);
    // The host's scope initialisation must not have been hijacked by the remote.
    expect(app1Instance.id).not.toBe(hostInstance.id);

    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("both generations end up registered and consumed from the single default scope", async ({
    page,
  }) => {
    const { errors } = watchErrors(page);
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnostics/ }).click();
    await expect(page.getByTestId("page-runtime-summary")).toBeVisible({ timeout: 20000 });

    const runtimes = await readPageRuntimes(page);
    const versions = runtimes.react.map((instance) => instance.version).sort();
    expect(versions).toEqual([REACT_16_VERSION, REACT_19_VERSION].sort());
    expect(runtimes.react).toHaveLength(2);

    // One scope, no duplication inside a generation: the three 16 consumers share one
    // instance, which is only possible if they all read the same default scope.
    const shared16 = runtimes.react.find((instance) => instance.version === REACT_16_VERSION);
    expect(shared16.consumers.sort()).toEqual([...REACT_16_APPS].sort());

    expect(errors).toEqual([]);
  });

  test("every remote also boots standalone against its own default scope", async ({ page }) => {
    for (const id of REMOTE_IDS) {
      const { errors, failedRequests } = watchErrors(page);
      await page.goto(`http://localhost:${APPS[id].port}/`);
      await expect(page.getByTestId(APPS[id].root)).toBeVisible({ timeout: 20000 });

      const runtimes = await readPageRuntimes(page);
      // Standalone there is exactly one generation on the page: the app's own.
      expect(runtimes.react).toHaveLength(1);
      expect(runtimes.react[0].version).toBe(APPS[id].react);
      expect(runtimes.react[0].consumers).toEqual([id]);
      expect(errors).toEqual([]);
      expect(failedRequests).toEqual([]);
    }
  });
});
