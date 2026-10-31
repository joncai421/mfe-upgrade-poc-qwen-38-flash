const { test, expect } = require("@playwright/test");
const { watchErrors, readRuntimeRow, openRemote } = require("../helpers");
const { RUNTIME_MATRIX, REMOTE_IDS } = require("../expectations");

// PRD 5.5 / 7.1 e2e react-runtime (Option B): prove in a real browser which React
// runtime each application actually executes with, and that the React 16 and
// React 19 generations coexist on one page. package.json is never consulted.
test.describe("react-runtime — React 16 + React 19 coexistence", () => {
  test("diagnostics reports mixed React versions across the two share scopes", async ({ page }) => {
    const { errors, failedRequests } = watchErrors(page);
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnostics/ }).click();
    await expect(page.getByTestId("diagnostics")).toBeVisible();

    for (const id of ["containerApp", ...REMOTE_IDS]) {
      const row = await readRuntimeRow(page, id);
      expect(row, `${id} runtime`).toMatchObject({
        react: RUNTIME_MATRIX[id].react,
        reactDom: RUNTIME_MATRIX[id].reactDom,
        shareScope: RUNTIME_MATRIX[id].shareScope,
        renderer: RUNTIME_MATRIX[id].renderer,
      });
    }
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("the container header badge still reports the container's own React 16", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("container-react-version")).toContainText(RUNTIME_MATRIX.containerApp.react);
  });

  test("App 1 is interactive while running React 19, with no cross-version errors", async ({
    page,
  }) => {
    const { errors, failedRequests } = watchErrors(page);
    await page.goto("/");
    await openRemote(page, /App 1/, "mfeApp1");

    const badge = await readRuntimeRow(page, "mfeApp1");
    expect(badge.react).toBe(RUNTIME_MATRIX.mfeApp1.react);
    expect(badge.renderer).toBe("react-dom/client:createRoot");

    await page.getByTestId("increment-btn").click();
    await expect(page.getByTestId("counter-value")).toHaveText("1");

    // React 16 and React 19 disagree about hook internals; a mismatch would show
    // up here as an "Invalid hook call" console error.
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("React 16 remotes keep working after the React 19 remote has run", async ({ page }) => {
    const { errors } = watchErrors(page);
    await page.goto("/");
    await openRemote(page, /App 1/, "mfeApp1");
    await openRemote(page, /App 2/, "mfeApp2");

    const app2 = await readRuntimeRow(page, "mfeApp2");
    expect(app2.react).toBe(RUNTIME_MATRIX.mfeApp2.react);
    expect(app2.sharesWithContainer).toBe("yes");
    await page.getByTestId("fullName-input").fill("Ada");
    await expect(page.getByTestId("fullName-input")).toHaveValue("Ada");
    expect(errors).toEqual([]);
  });
});
