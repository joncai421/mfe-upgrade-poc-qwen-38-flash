const { test, expect } = require("@playwright/test");

// PRD 4.4 scenarios 6-7: App 2 loads and its profile functionality works.
test.describe("MFE App 2", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /App 2/ }).click();
    await expect(page.getByTestId("status-mfeApp2")).toHaveText("mounted", { timeout: 15000 });
  });

  test("shows validation errors for an incomplete profile", async ({ page }) => {
    await page.getByTestId("save-btn").click();
    await expect(page.getByTestId("fullName-error")).toBeVisible();
    await expect(page.getByTestId("email-error")).toBeVisible();
  });

  test("saves a valid profile and displays it", async ({ page }) => {
    await page.getByTestId("fullName-input").fill("Bob Jones");
    await page.getByTestId("email-input").fill("bob@example.com");
    await page.getByTestId("age-input").fill("41");
    await page.getByTestId("save-btn").click();
    await expect(page.getByTestId("saved-profile")).toBeVisible();
    await expect(page.getByTestId("saved-name")).toContainText("Bob Jones");
  });
});
