const { test, expect } = require("@playwright/test");
const { watchErrors } = require("../../helpers");

// PRD 4.4 integration: the container loads each remote through the REAL
// Module Federation runtime and mounts it into its own DOM host element.
test.describe("federation-loading", () => {
  test("container loads all three remotes through the MF runtime", async ({ page }) => {
    const { errors, failedRequests } = watchErrors(page);

    await page.goto("/");
    await expect(page.getByTestId("app-shell")).toBeVisible();

    // Default route mounts App 1.
    await expect(page.getByTestId("remote-mfe-app-1")).toBeVisible();
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 15000 });
    await expect(page.getByTestId("app1-root")).toBeVisible();

    // App 2 via navigation.
    await page.getByRole("link", { name: /App 2/ }).click();
    await expect(page.getByTestId("status-mfeApp2")).toHaveText("mounted", { timeout: 15000 });
    await expect(page.getByTestId("app2-root")).toBeVisible();

    // App 3 via navigation.
    await page.getByRole("link", { name: /App 3/ }).click();
    await expect(page.getByTestId("status-mfeApp3")).toHaveText("mounted", { timeout: 15000 });
    await expect(page.getByTestId("app3-root")).toBeVisible();

    // The remote chunk requests must have been served (remoteEntry.js loaded).
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("each remote mounts into its own dedicated host element", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 15000 });
    const host = page.getByTestId("host-mfeApp1");
    await expect(host.locator('[data-testid="app1-root"]')).toHaveCount(1);
  });
});
