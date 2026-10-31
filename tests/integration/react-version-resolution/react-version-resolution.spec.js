const { test, expect } = require("@playwright/test");

// PRD 4.4 integration: verify the ACTUAL React runtime each remote resolves
// through the shared Module Federation scope (not package.json metadata).
test.describe("react-version-resolution", () => {
  test("Diagnostics reports React 16.14.0 for the container and every remote", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnostics/ }).click();
    await expect(page.getByTestId("diagnostics")).toBeVisible();

    // Container reports its own runtime synchronously.
    await expect(page.getByTestId("runtime-containerApp")).toHaveAttribute(
      "data-react-version",
      "16.14.0"
    );

    // Each remote is probed through the real MF runtime and reports matching versions.
    for (const id of ["mfeApp1", "mfeApp2", "mfeApp3"]) {
      const row = page.getByTestId(`runtime-${id}`);
      await expect(row).toHaveAttribute("data-react-version", "16.14.0", { timeout: 15000 });
      await expect(row).toHaveAttribute("data-react-dom-version", "16.14.0");
    }
  });

  test("React and React DOM resolve to matching versions together", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 15000 });
    const badge = page.getByTestId("runtime-mfeApp1");
    const reactV = await badge.getAttribute("data-react-version");
    const reactDomV = await badge.getAttribute("data-react-dom-version");
    expect(reactV).toBe("16.14.0");
    expect(reactDomV).toBe(reactV);
  });
});
