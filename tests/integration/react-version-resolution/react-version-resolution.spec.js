const { test, expect } = require("@playwright/test");
const { watchErrors, readRuntimeRow } = require("../../helpers");
const { RUNTIME_MATRIX, REMOTE_IDS } = require("../../expectations");

// PRD 5.5 integration (Option B): verify the ACTUAL React runtime each
// application resolves through its Module Federation share scope. App 1 must run
// React 19 from "react19"; the container, App 2 and App 3 must keep running
// React 16 from "react16" — on one page, with no invalid hook calls.
test.describe("react-version-resolution — separate share scopes", () => {
  test("each application reports the React runtime expected by the Option B matrix", async ({
    page,
  }) => {
    const { errors } = watchErrors(page);
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnostics/ }).click();
    await expect(page.getByTestId("diagnostics")).toBeVisible();

    const container = await readRuntimeRow(page, "containerApp");
    expect(container).toMatchObject({
      react: RUNTIME_MATRIX.containerApp.react,
      reactDom: RUNTIME_MATRIX.containerApp.reactDom,
      shareScope: RUNTIME_MATRIX.containerApp.shareScope,
      renderer: RUNTIME_MATRIX.containerApp.renderer,
    });

    for (const id of REMOTE_IDS) {
      const row = await readRuntimeRow(page, id);
      expect(row, `${id} runtime`).toMatchObject({
        react: RUNTIME_MATRIX[id].react,
        reactDom: RUNTIME_MATRIX[id].reactDom,
        shareScope: RUNTIME_MATRIX[id].shareScope,
        renderer: RUNTIME_MATRIX[id].renderer,
        sharesWithContainer: RUNTIME_MATRIX[id].sharesWithContainer,
      });
    }

    // "No invalid hook call errors" — React raises those as console errors.
    expect(errors).toEqual([]);
  });

  test("React and React DOM resolve to matching versions in every application", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnostics/ }).click();

    for (const id of ["containerApp", ...REMOTE_IDS]) {
      const row = await readRuntimeRow(page, id);
      expect(row.react, `${id} react/react-dom pairing`).toBe(row.reactDom);
    }
  });

  test("React 16 and React 19 are live on the page at the same time", async ({ page }) => {
    const { errors, failedRequests } = watchErrors(page);
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnostics/ }).click();

    // The diagnostics probe keeps all three remotes mounted in hidden roots until
    // it unmounts on teardown, so these rows are true while all run concurrently.
    const app1 = await readRuntimeRow(page, "mfeApp1");
    const app2 = await readRuntimeRow(page, "mfeApp2");
    expect(app1.react).toBe("19.3.1");
    expect(app2.react).toBe("16.14.0");
    expect(app1.shareScope).toBe("react19");
    expect(app2.shareScope).toBe("react16");
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("the mounted remote badge reports the same runtime as the diagnostics probe", async ({
    page,
  }) => {
    await page.goto("/");
    // Default route mounts App 1 (React 19) inside a React 16 container.
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 15000 });
    const badge = await readRuntimeRow(page, "mfeApp1");
    expect(badge).toMatchObject({
      react: RUNTIME_MATRIX.mfeApp1.react,
      reactDom: RUNTIME_MATRIX.mfeApp1.reactDom,
      shareScope: RUNTIME_MATRIX.mfeApp1.shareScope,
      sharesWithContainer: "no",
    });
  });
});
