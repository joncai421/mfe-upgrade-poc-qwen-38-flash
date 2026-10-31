const { test, expect } = require("@playwright/test");

// PRD 4.4 integration: Redux state is isolated per micro-frontend and per
// mount. No cross-application state leaks; each app's functionality is independent.
test.describe("application-isolation", () => {
  test("App 1 Redux state does not leak into App 2 or App 3", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 15000 });

    // Mutate App 1's store.
    page.on("dialog", (d) => d.dismiss());
    await page.getByTestId("increment-btn").click();
    await page.getByTestId("increment-btn").click();
    await expect(page.getByTestId("counter-value")).toHaveText("2");

    // App 2 renders its own unrelated store (empty profile form).
    await page.getByRole("link", { name: /App 2/ }).click();
    await expect(page.getByTestId("status-mfeApp2")).toHaveText("mounted", { timeout: 15000 });
    await expect(page.getByTestId("fullName-input")).toHaveValue("");

    // App 3 renders its own store (all 7 reports, no filters).
    await page.getByRole("link", { name: /App 3/ }).click();
    await expect(page.getByTestId("status-mfeApp3")).toHaveText("mounted", { timeout: 15000 });
    await expect(page.getByTestId("report-count")).toHaveText("Showing 7 reports");
  });

  test("remounting App 1 yields a fresh store (state does not persist across unmount)", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 15000 });
    await page.getByTestId("increment-btn").click();
    await expect(page.getByTestId("counter-value")).toHaveText("1");

    await page.getByRole("link", { name: /App 2/ }).click();
    await page.getByRole("link", { name: /App 1/ }).click();
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 15000 });
    await expect(page.getByTestId("counter-value")).toHaveText("0");
  });
});
