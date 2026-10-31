const { test, expect } = require("@playwright/test");

// PRD 5.5/7.1 react-runtime: verify the ACTUAL React version executing in the
// browser for the container and each remote — not package.json metadata.
// In the baseline every application resolves the shared React 16.14.0 singleton.
test.describe("react-runtime", () => {
  test("container and every remote run React 16.14.0 at runtime", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnostics/ }).click();
    await expect(page.getByTestId("diagnostics")).toBeVisible();

    await expect(page.getByTestId("runtime-containerApp")).toHaveAttribute("data-react-version", "16.14.0");

    for (const id of ["mfeApp1", "mfeApp2", "mfeApp3"]) {
      const row = page.getByTestId(`runtime-${id}`);
      await expect(row).toHaveAttribute("data-react-version", "16.14.0", { timeout: 15000 });
      await expect(row).toHaveAttribute("data-react-dom-version", "16.14.0");
    }
  });

  test("the container header badge reports React 16.14.0", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("container-react-version")).toContainText("16.14.0");
  });
});
