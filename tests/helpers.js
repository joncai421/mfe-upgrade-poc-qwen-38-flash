// Shared Playwright helpers for integration + E2E suites.

/**
 * Attach listeners that record critical console errors and failed network
 * requests. MF chunk/script loads via <script> are CORS-free; a genuinely
 * failed request (non-4xx-by-design) or a page error is captured for assertion.
 */
function watchErrors(page, { ignore = [] } = {}) {
  const errors = [];
  const failedRequests = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!ignore.some((re) => re.test(text))) {
        errors.push(text);
      }
    }
  });

  page.on("pageerror", (err) => {
    const text = String(err && err.message ? err.message : err);
    if (!ignore.some((re) => re.test(text))) {
      errors.push(text);
    }
  });

  page.on("requestfailed", (req) => {
    const url = req.url();
    // Ignore favicon noise; aborted requests during navigation are not failures.
    const failure = req.failure();
    if (!/favicon/i.test(url) && failure && !/ERR_ABORTED/i.test(failure.errorText || "")) {
      failedRequests.push(`${url} :: ${failure.errorText}`);
    }
  });

  return { errors, failedRequests };
}

// Navigate the container to a remote tab and wait for its status badge to be "mounted".
async function openRemote(page, app, id) {
  await page.getByRole("link", { name: app }).click();
  await page.waitForSelector(`[data-testid="status-${id}"] >> text=mounted`, { timeout: 15000 });
}

/**
 * Read what an application REPORTS about the React runtime it is actually
 * executing with. Backed by the diagnostics table / mount-status badge, whose
 * values come from getRuntimeInfo() inside each application — so these are
 * runtime facts, not package.json metadata (PRD 5.5, 11 "testing quality").
 */
async function readRuntimeRow(page, id) {
  const row = page.getByTestId(`runtime-${id}`).first();
  await row.waitFor({ timeout: 20000 });
  return {
    react: await row.getAttribute("data-react-version"),
    reactDom: await row.getAttribute("data-react-dom-version"),
    shareScope: await row.getAttribute("data-share-scope"),
    renderer: await row.getAttribute("data-renderer"),
    sharesWithContainer: await row.getAttribute("data-shares-container-runtime"),
  };
}

module.exports = { watchErrors, openRemote, readRuntimeRow };
