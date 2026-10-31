const { test, expect } = require("@playwright/test");

// PRD 4.4 scenarios 8-9: App 3 loads and its report filtering works.
test.describe("MFE App 3", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /App 3/ }).click();
    await expect(page.getByTestId("status-mfeApp3")).toHaveText("mounted", { timeout: 15000 });
  });

  test("lists all reports by default", async ({ page }) => {
    await expect(page.getByTestId("report-count")).toHaveText("Showing 7 reports");
  });

  test("filters by status", async ({ page }) => {
    await page.getByTestId("status-select").selectOption("approved");
    await expect(page.getByTestId("report-count")).toHaveText("Showing 3 reports");
    await expect(page.getByTestId("report-item-1")).toBeVisible();
    await expect(page.getByTestId("report-item-2")).toHaveCount(0);
  });

  test("filters by search query", async ({ page }) => {
    await page.getByTestId("query-input").fill("revenue");
    await expect(page.getByTestId("report-count")).toHaveText("Showing 1 report");
  });

  test("clears filters back to the full list", async ({ page }) => {
    await page.getByTestId("status-select").selectOption("rejected");
    await expect(page.getByTestId("report-count")).toHaveText("Showing 1 report");
    await page.getByTestId("clear-filters-btn").click();
    await expect(page.getByTestId("report-count")).toHaveText("Showing 7 reports");
  });
});
