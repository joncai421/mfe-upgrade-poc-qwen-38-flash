const { test, expect } = require("@playwright/test");
const { watchErrors } = require("../helpers");

// PRD 4.4 E2E scenarios 1-2 and 10-11: shell display + navigation between MFEs
// with correct unmount of the previously active application.
test.describe("navigation", () => {
  test("opens the container and shows the application shell", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("app-shell")).toBeVisible();
    await expect(page.getByRole("heading", { name: /MFE Container/ })).toBeVisible();
    await expect(page.getByTestId("navigation")).toBeVisible();
  });

  test("navigates across all three remotes and unmounts the previous one", async ({ page }) => {
    const { errors, failedRequests } = watchErrors(page);
    await page.goto("/");

    // Scenario 3-4: App 1 loads.
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 15000 });

    // Scenario 6: navigate to App 2.
    await page.getByRole("link", { name: /App 2/ }).click();
    await expect(page.getByTestId("status-mfeApp2")).toHaveText("mounted", { timeout: 15000 });
    // Scenario 11: App 1 was unmounted.
    await expect(page.locator('[data-testid="host-mfeApp1"] [data-testid="app1-root"]')).toHaveCount(0);

    // Scenario 8: navigate to App 3.
    await page.getByRole("link", { name: /App 3/ }).click();
    await expect(page.getByTestId("status-mfeApp3")).toHaveText("mounted", { timeout: 15000 });

    // Scenario 10: switch back and forth several times.
    for (let i = 0; i < 3; i += 1) {
      await page.getByRole("link", { name: /App 1/ }).click();
      await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 15000 });
      await page.getByRole("link", { name: /App 2/ }).click();
      await expect(page.getByTestId("status-mfeApp2")).toHaveText("mounted", { timeout: 15000 });
      await page.getByRole("link", { name: /App 3/ }).click();
      await expect(page.getByTestId("status-mfeApp3")).toHaveText("mounted", { timeout: 15000 });
    }

    // Scenario 12: no critical console errors or failed remote chunk requests.
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
});
