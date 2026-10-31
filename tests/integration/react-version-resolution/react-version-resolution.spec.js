const { test, expect } = require("@playwright/test");
const { readPageRuntimes } = require("../../helpers");
const {
  APPS,
  REACT_16_VERSION,
  REACT_19_VERSION,
  REACT_16_APPS,
  REACT_19_APPS,
  REMOTE_IDS,
  SHARE_SCOPE,
} = require("../../expectations");

// PRD 6.4/6.6: verify the ACTUAL provider each application negotiates out of the
// single default share scope. Version numbers alone are not enough here — a silent
// local fallback would still print the right version — so the assertions compare the
// IDENTITY of the resolved React module object between applications.
test.describe("react-version-resolution (Option C: default scope, two generations)", () => {
  test("Diagnostics reports the mixed matrix: App 1 on React 19, everyone else on React 16", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnostics/ }).click();
    await expect(page.getByTestId("diagnostics")).toBeVisible();

    for (const id of Object.keys(APPS)) {
      const row = page.getByTestId(`runtime-${id}`);
      await expect(row).toHaveAttribute("data-react-version", APPS[id].react, { timeout: 20000 });
      await expect(row).toHaveAttribute("data-react-dom-version", APPS[id].react);
      await expect(row).toHaveAttribute("data-share-scope", SHARE_SCOPE);
      await expect(row).toHaveAttribute("data-renderer", APPS[id].renderer);
    }

    expect(REACT_19_APPS).toEqual(["mfeApp1"]);
    expect(REACT_16_APPS).toEqual(["containerApp", "mfeApp2", "mfeApp3"]);
  });

  test("React and React DOM always resolve to matching versions, per application", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("status-mfeApp1")).toHaveText("mounted", { timeout: 20000 });

    const badge = page.getByTestId("runtime-mfeApp1");
    const reactV = await badge.getAttribute("data-react-version");
    const reactDomV = await badge.getAttribute("data-react-dom-version");
    expect(reactV).toBe(REACT_19_VERSION);
    expect(reactDomV).toBe(reactV);
    // The `react-dom` root and the `react-dom/client` subpath must be the same
    // generation, otherwise createRoot would come from React 16.
    expect(await badge.getAttribute("data-renderer")).toBe("concurrent (createRoot)");
  });

  test("the three React 16 consumers share ONE instance while App 1 has its own", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Diagnostics/ }).click();
    await expect(page.getByTestId("page-runtime-summary")).toBeVisible({ timeout: 20000 });

    const runtimes = await readPageRuntimes(page);
    expect(runtimes).not.toBeNull();

    const react16 = runtimes.react.filter((i) => i.version === REACT_16_VERSION);
    const react19 = runtimes.react.filter((i) => i.version === REACT_19_VERSION);

    // Two generations coexist in the default scope...
    expect(runtimes.react).toHaveLength(2);
    expect(react16).toHaveLength(1);
    expect(react19).toHaveLength(1);

    // ...but each generation is a SINGLE shared instance, i.e. the scope really
    // served it instead of each build falling back to its own copy.
    expect(react16[0].consumers.sort()).toEqual([...REACT_16_APPS].sort());
    expect(react19[0].consumers).toEqual(REACT_19_APPS);

    // React DOM follows the same split, so no application mixes generations.
    expect(runtimes.reactDom).toHaveLength(2);
    for (const instance of runtimes.reactDom) {
      expect(instance.version).toBe(
        instance.consumers.every((app) => APPS[app].generation === 16)
          ? REACT_16_VERSION
          : REACT_19_VERSION
      );
    }

    const summary = page.getByTestId("page-runtime-summary");
    await expect(summary).toHaveAttribute("data-react-instance-count", "2");
    await expect(summary).toHaveAttribute("data-react-dom-instance-count", "2");
    await expect(summary).toHaveAttribute(
      "data-distinct-react-versions",
      [REACT_16_VERSION, REACT_19_VERSION].join(",")
    );
  });

  test("each remote reports the default scope and its own generation on its active view", async ({
    page,
  }) => {
    await page.goto("/");
    for (const id of REMOTE_IDS) {
      await page.getByRole("link", { name: APPS[id].tab }).click();
      await expect(page.getByTestId(`status-${id}`)).toHaveText("mounted", { timeout: 20000 });
      const badge = page.getByTestId(`runtime-${id}`);
      await expect(badge).toHaveAttribute("data-react-version", APPS[id].react);
      await expect(badge).toHaveAttribute("data-share-scope", SHARE_SCOPE);
      // The instance id reported on the active view belongs to that generation.
      const instanceId = await badge.getAttribute("data-react-instance");
      expect(instanceId).toMatch(new RegExp(`^react-\\d+$`));
      const consumers = (await badge.getAttribute("data-react-instance-consumers")).split(",");
      expect(consumers).toContain(id);
    }
  });

  test("no application mixes generations: hooks run without invalid-hook-call errors", async ({
    page,
  }) => {
    const hookErrors = [];
    page.on("console", (msg) => {
      if (/invalid hook call|two copies of react|should not already be set/i.test(msg.text())) {
        hookErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      if (/invalid hook call|Minified React error/i.test(String(err.message))) {
        hookErrors.push(String(err.message));
      }
    });

    await page.goto("/");
    for (const id of REMOTE_IDS) {
      await page.getByRole("link", { name: APPS[id].tab }).click();
      await expect(page.getByTestId(`status-${id}`)).toHaveText("mounted", { timeout: 20000 });
    }

    expect(hookErrors).toEqual([]);
  });
});
