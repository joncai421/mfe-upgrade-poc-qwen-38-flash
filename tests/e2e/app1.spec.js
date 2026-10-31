const { test, expect } = require("@playwright/test");

// PRD 4.4 scenarios 3-5: App 1 loads, renders and its Redux functionality works.
test.describe("MFE App 1", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 15000 });
  });

  test("increments and decrements the Redux counter", async ({ page }) => {
    await expect(page.getByTestId("counter-value")).toHaveText("0");
    await page.getByTestId("increment-btn").click();
    await page.getByTestId("increment-btn").click();
    await expect(page.getByTestId("counter-value")).toHaveText("2");
    await page.getByTestId("decrement-btn").click();
    await expect(page.getByTestId("counter-value")).toHaveText("1");
  });

  test("validates and submits the contact form", async ({ page }) => {
    await page.on("dialog", (d) => d.dismiss());
    await page.getByTestId("submit-btn").click();
    await expect(page.getByTestId("name-error")).toBeVisible();
    await page.getByTestId("name-input").fill("Alice");
    await page.getByTestId("email-input").fill("alice@example.com");
    await page.getByTestId("submit-btn").click();
    await expect(page.getByTestId("form-success")).toBeVisible();
  });

  test("navigates its own local route (Details) and reads shared Redux state", async ({ page }) => {
    await page.getByTestId("increment-btn").click();
    await page.getByTestId("increment-btn").click();
    await page.getByRole("link", { name: "Details" }).click();
    await expect(page.getByTestId("app1-details")).toBeVisible();
    await expect(page.getByTestId("details-value")).toHaveText("Current count: 2");
  });
});
