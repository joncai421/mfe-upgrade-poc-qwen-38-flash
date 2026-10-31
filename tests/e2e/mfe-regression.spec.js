const { test, expect } = require("@playwright/test");
const { watchErrors } = require("../helpers");

// PRD 7.3 regression matrix: every application loads, its Redux interaction
// works, navigation works, mount/unmount works, and no critical console errors.
// This suite is intentionally behaviour-based (not compile-based) so it can be
// reused unchanged as the regression gate on the React 19 upgrade branches.
const FLOWS = [
  { tab: /App 1/, id: "mfeApp1", root: "app1-root" },
  { tab: /App 2/, id: "mfeApp2", root: "app2-root" },
  { tab: /App 3/, id: "mfeApp3", root: "app3-root" },
];

test.describe("mfe-regression", () => {
  for (const flow of FLOWS) {
    test(`${flow.id} loads, renders and behaves without console errors`, async ({ page }) => {
      const { errors, failedRequests } = watchErrors(page);
      await page.goto("/");
      await page.getByRole("link", { name: flow.tab }).click();
      await expect(page.getByTestId(`status-${flow.id}`)).toHaveText("mounted", { timeout: 15000 });
      await expect(page.getByTestId(flow.root)).toBeVisible();
      expect(errors).toEqual([]);
      expect(failedRequests).toEqual([]);
    });
  }

  test("all three applications coexist via repeated navigation", async ({ page }) => {
    const { errors } = watchErrors(page);
    await page.goto("/");
    for (let i = 0; i < 2; i += 1) {
      for (const flow of FLOWS) {
        await page.getByRole("link", { name: flow.tab }).click();
        await expect(page.getByTestId(`status-${flow.id}`)).toHaveText("mounted", { timeout: 15000 });
      }
    }
    expect(errors).toEqual([]);
  });
});
