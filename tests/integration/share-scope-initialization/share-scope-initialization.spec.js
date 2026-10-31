const { test, expect } = require("@playwright/test");
const { watchErrors, readRuntimeRow } = require("../../helpers");
const { RUNTIME_MATRIX, REMOTE_IDS } = require("../../expectations");

// PRD 5.5 integration (Option B): the two share scopes must be initialized and
// used independently. Loading order must not let an application pick up the other
// generation's React, and same-generation applications must really share ONE
// instance (verified by identity, not by version strings).

const TABS = { mfeApp1: /App 1/, mfeApp2: /App 2/, mfeApp3: /App 3/ };

async function navigateInOrder(page, ids) {
  await page.goto("/");
  for (const id of ids) {
    await page.getByRole("link", { name: TABS[id] }).click();
    await expect(page.getByTestId(`status-${id}`)).toHaveText("mounted", { timeout: 15000 });
    const badge = await readRuntimeRow(page, id);
    expect(badge, `${id} after ${ids.join(" -> ")}`).toMatchObject({
      react: RUNTIME_MATRIX[id].react,
      shareScope: RUNTIME_MATRIX[id].shareScope,
      sharesWithContainer: RUNTIME_MATRIX[id].sharesWithContainer,
    });
  }
}

test.describe("share-scope-initialization", () => {
  test("App 1 (React 19) loaded before the React 16 remotes resolves its own scope", async ({
    page,
  }) => {
    const { errors, failedRequests } = watchErrors(page);
    await navigateInOrder(page, ["mfeApp1", "mfeApp2", "mfeApp3"]);
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("React 16 remotes loaded before App 1 keep App 1 out of their scope", async ({ page }) => {
    const { errors, failedRequests } = watchErrors(page);
    await navigateInOrder(page, ["mfeApp3", "mfeApp2", "mfeApp1"]);
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("same-generation applications share ONE React instance; App 1 does not", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnostics/ }).click();

    // "yes" means the remote read back the token the container wrote on the React
    // MODULE OBJECT IT resolved — i.e. the react16 scope handed out one instance.
    for (const id of ["mfeApp2", "mfeApp3"]) {
      const row = await readRuntimeRow(page, id);
      expect(row.sharesWithContainer, id).toBe("yes");
      expect(row.react, id).toBe(RUNTIME_MATRIX[id].react);
    }
    const app1 = await readRuntimeRow(page, "mfeApp1");
    expect(app1.sharesWithContainer).toBe("no");
    expect(app1.react).toBe(RUNTIME_MATRIX.mfeApp1.react);
  });

  test("singleton: exactly one React 16 and one React 19 runtime exist on the page", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnostics/ }).click();

    const versions = {};
    for (const id of ["containerApp", ...REMOTE_IDS]) {
      const row = await readRuntimeRow(page, id);
      versions[id] = `${row.shareScope}@${row.react}`;
    }
    // Two distinct runtime identities, one per scope — never a third version,
    // and never a scope that resolved an incompatible singleton.
    expect(new Set(Object.values(versions))).toEqual(new Set(["react16@16.14.0", "react19@19.3.1"]));
  });

  test("repeated mount/unmount cycles re-resolve the same scopes without errors", async ({
    page,
  }) => {
    const { errors, failedRequests } = watchErrors(page);
    await page.goto("/");

    const rows = {};
    for (let round = 0; round < 3; round += 1) {
      for (const id of REMOTE_IDS) {
        await page.getByRole("link", { name: TABS[id] }).click();
        await expect(page.getByTestId(`status-${id}`)).toHaveText("mounted", { timeout: 15000 });
        // Each application is only on screen while it is the active remote, so the
        // runtime badge has to be read at that moment — every round, on a remount.
        rows[id] = await readRuntimeRow(page, id);
      }
    }
    for (const id of REMOTE_IDS) {
      expect(rows[id], id).toMatchObject({
        react: RUNTIME_MATRIX[id].react,
        shareScope: RUNTIME_MATRIX[id].shareScope,
        sharesWithContainer: RUNTIME_MATRIX[id].sharesWithContainer,
      });
    }
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
});
