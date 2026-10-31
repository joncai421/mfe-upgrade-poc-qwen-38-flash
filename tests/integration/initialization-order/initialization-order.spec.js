const { test, expect } = require("@playwright/test");
const { watchErrors, readPageRuntimes } = require("../../helpers");
const {
  APPS,
  REACT_16_VERSION,
  REACT_19_VERSION,
  REACT_16_APPS,
} = require("../../expectations");

/**
 * PRD 6.6 (5) + the loading-sequence matrix: `singleton: false` means version
 * resolution is negotiated at consumption time, so the order in which remotes are
 * initialised must not change WHICH provider an application ends up with.
 *
 * Each sequence asserts the same invariants: the mixed matrix holds, the page still
 * runs exactly two React instances (one per generation — a third would mean a remote
 * silently fell back to its own copy), and every application stays functional.
 */
async function expectSharedTwoGenerations(page) {
  const runtimes = await readPageRuntimes(page);
  expect(runtimes).not.toBeNull();
  expect(runtimes.react).toHaveLength(2);

  const react16 = runtimes.react.find((i) => i.version === REACT_16_VERSION);
  const react19 = runtimes.react.find((i) => i.version === REACT_19_VERSION);
  expect(react16).toBeDefined();
  expect(react19).toBeDefined();
  expect(react19.consumers).toEqual(["mfeApp1"]);
  return { react16, react19 };
}

async function expectVersions(page, ids) {
  for (const id of ids) {
    const badge = page.getByTestId(`runtime-${id}`);
    await expect(badge).toHaveAttribute("data-react-version", APPS[id].react, { timeout: 20000 });
    await expect(badge).toHaveAttribute("data-react-dom-version", APPS[id].react);
    await expect(badge).toHaveAttribute("data-share-scope", "default");
  }
}

// The Redux-backed behaviour each application is known for (PRD 2.3), used to prove
// that loading order does not cost any application its functionality.
async function interact(page, id) {
  if (id === "mfeApp1") {
    await page.getByTestId("increment-btn").click();
    await expect(page.getByTestId("counter-value")).toHaveText("1");
  } else if (id === "mfeApp2") {
    await page.getByTestId("fullName-input").fill("Bob Jones");
    await page.getByTestId("email-input").fill("bob@example.com");
    await page.getByTestId("age-input").fill("41");
    await page.getByTestId("save-btn").click();
    await expect(page.getByTestId("saved-name")).toContainText("Bob Jones");
  } else if (id === "mfeApp3") {
    await expect(page.getByTestId("report-count")).toHaveText("Showing 7 reports");
    await page.getByTestId("status-select").selectOption("approved");
    await expect(page.getByTestId("report-count")).toHaveText("Showing 3 reports");
  }
}

test.describe("initialization-order (Option C default scope)", () => {
  test("React 19 app loads first, then the React 16 remotes", async ({ page }) => {
    const { errors, failedRequests } = watchErrors(page);
    await page.goto("/"); // default route is App 1 (React 19)
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 20000 });
    await expectVersions(page, ["mfeApp1"]);
    await interact(page, "mfeApp1");

    for (const id of ["mfeApp2", "mfeApp3"]) {
      await page.getByRole("link", { name: APPS[id].tab }).click();
      await expect(page.getByTestId(`status-${id}`)).toHaveText("mounted", { timeout: 20000 });
      await expectVersions(page, [id]);
      await interact(page, id);
    }

    const { react16 } = await expectSharedTwoGenerations(page);
    expect(react16.consumers.sort()).toEqual([...REACT_16_APPS].sort());
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("React 16 remotes load first, then the React 19 app", async ({ page }) => {
    const { errors, failedRequests } = watchErrors(page);
    await page.goto("/");
    // Start the 16-generation remote first so its provider is registered before the
    // React 19 build ever initialises its share scope.
    for (const id of ["mfeApp2", "mfeApp3"]) {
      await page.getByRole("link", { name: APPS[id].tab }).click();
      await expect(page.getByTestId(`status-${id}`)).toHaveText("mounted", { timeout: 20000 });
      await expectVersions(page, [id]);
      await interact(page, id);
    }

    await page.getByRole("link", { name: APPS.mfeApp1.tab }).click();
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 20000 });
    await expectVersions(page, ["mfeApp1"]);
    await interact(page, "mfeApp1");

    const { react16, react19 } = await expectSharedTwoGenerations(page);
    expect(react16.consumers.sort()).toEqual([...REACT_16_APPS].sort());
    expect(react19.consumers).toEqual(["mfeApp1"]);
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("repeated switching never adds a third React instance", async ({ page }) => {
    const { errors } = watchErrors(page);
    await page.goto("/");
    const order = ["mfeApp1", "mfeApp2", "mfeApp3", "mfeApp1", "mfeApp3", "mfeApp2"];
    for (const id of order) {
      await page.getByRole("link", { name: APPS[id].tab }).click();
      await expect(page.getByTestId(`status-${id}`)).toHaveText("mounted", { timeout: 20000 });
      // Only the active remote is present; the previous one released its root.
      await expect(page.locator(`[data-testid="host-${id}"] [data-testid="${APPS[id].root}"]`)).toHaveCount(1);
    }

    const { react16 } = await expectSharedTwoGenerations(page);
    // Six activations, still one shared instance per generation.
    expect(react16.consumers.sort()).toEqual([...REACT_16_APPS].sort());
    expect(errors).toEqual([]);
  });

  test("a full page refresh re-negotiates the same versions", async ({ page }) => {
    const { errors, failedRequests } = watchErrors(page);
    await page.goto("/");
    await page.getByRole("link", { name: APPS.mfeApp2.tab }).click();
    await expect(page.getByTestId("status-mfeApp2")).toHaveText("mounted", { timeout: 20000 });

    await page.reload();
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 20000 });
    await expectVersions(page, ["mfeApp1"]);
    await page.getByRole("link", { name: APPS.mfeApp3.tab }).click();
    await expect(page.getByTestId("status-mfeApp3")).toHaveText("mounted", { timeout: 20000 });
    await expectVersions(page, ["mfeApp3"]);

    await expectSharedTwoGenerations(page);
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
});
