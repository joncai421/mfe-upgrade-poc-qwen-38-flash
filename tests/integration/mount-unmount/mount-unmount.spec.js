const { test, expect } = require("@playwright/test");
const { watchErrors } = require("../../helpers");

// PRD 4.4 integration: remotes can be mounted and unmounted repeatedly,
// with only the active remote present in the DOM and no runtime errors.
test.describe("mount-unmount", () => {
  test("repeatedly switching remotes mounts and unmounts cleanly", async ({ page }) => {
    const { errors, failedRequests } = watchErrors(page);
    await page.goto("/");

    for (let round = 0; round < 3; round += 1) {
      await page.getByRole("link", { name: /App 2/ }).click();
      await expect(page.getByTestId("status-mfeApp2")).toHaveText("mounted", { timeout: 15000 });
      // Only App 2 present; App 1 host is emptied (unmounted).
      await expect(page.getByTestId("app2-root")).toBeVisible();
      await expect(page.locator('[data-testid="host-mfeApp1"] [data-testid="app1-root"]')).toHaveCount(0);

      await page.getByRole("link", { name: /App 3/ }).click();
      await expect(page.getByTestId("status-mfeApp3")).toHaveText("mounted", { timeout: 15000 });
      await expect(page.locator('[data-testid="host-mfeApp2"] [data-testid="app2-root"]')).toHaveCount(0);

      await page.getByRole("link", { name: /App 1/ }).click();
      await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 15000 });
      await expect(page.getByTestId("app1-root")).toBeVisible();
      await expect(page.locator('[data-testid="host-mfeApp3"] [data-testid="app3-root"]')).toHaveCount(0);
    }

    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("a remote is mounted exactly once per activation (no duplicate React roots)", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 15000 });
    await expect(page.locator('[data-testid="host-mfeApp1"] [data-testid="app1-root"]')).toHaveCount(1);
  });
});
