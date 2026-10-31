const { test, expect } = require("@playwright/test");
const { watchErrors, readPageRuntimes, collectJsResourceTimings } = require("../helpers");
const {
  APPS,
  REACT_16_VERSION,
  REACT_19_VERSION,
  REACT_16_APPS,
  SHARE_SCOPE,
} = require("../expectations");

// PRD 6.6/7.3 react-runtime: verify the ACTUAL React version executing in the browser
// for the container and each remote — not package.json metadata — and prove the two
// generations really coexist as two shared instances in the ONE default scope.
test.describe("react-runtime (mixed 16/19 in the default scope)", () => {
  test("App 1 runs React 19 while the container and Apps 2-3 run React 16", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnostics/ }).click();
    await expect(page.getByTestId("diagnostics")).toBeVisible();

    for (const id of Object.keys(APPS)) {
      const row = page.getByTestId(`runtime-${id}`);
      await expect(row).toHaveAttribute("data-react-version", APPS[id].react, { timeout: 20000 });
      await expect(row).toHaveAttribute("data-react-dom-version", APPS[id].react);
      await expect(row).toHaveAttribute("data-share-scope", SHARE_SCOPE);
    }
  });

  test("the page runs exactly two React instances — one per generation, shared", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnostics/ }).click();
    await expect(page.getByTestId("page-runtime-summary")).toBeVisible({ timeout: 20000 });

    const runtimes = await readPageRuntimes(page);
    expect(runtimes.react).toHaveLength(2);
    expect(runtimes.reactDom).toHaveLength(2);

    const shared16 = runtimes.react.find((i) => i.version === REACT_16_VERSION);
    const shared19 = runtimes.react.find((i) => i.version === REACT_19_VERSION);
    // A silent local fallback would show up as a second 16.14.0 instance.
    expect(shared16.consumers.sort()).toEqual([...REACT_16_APPS].sort());
    expect(shared19.consumers).toEqual(["mfeApp1"]);
  });

  test("the container header badge still reports its own React 16 runtime", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("container-react-version")).toContainText(REACT_16_VERSION);
  });

  test("touring every application downloads no JS asset twice and logs no errors", async ({
    page,
  }) => {
    const { errors, failedRequests } = watchErrors(page);
    await page.goto("/");

    for (const id of ["mfeApp1", "mfeApp2", "mfeApp3", "mfeApp1"]) {
      await page.getByRole("link", { name: APPS[id].tab }).click();
      await expect(page.getByTestId(`status-${id}`)).toHaveText("mounted", { timeout: 20000 });
      await expect(page.getByTestId(APPS[id].root)).toBeVisible();
    }

    const timings = await collectJsResourceTimings(page);
    const urls = timings.map((entry) => entry.name);
    expect(new Set(urls).size).toBe(urls.length);
    expect(failedRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
});
