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
 * Read the page-wide runtime identity registry written by shared/runtime-identity.js.
 * This reports which React module OBJECT each application resolved, so a silent local
 * fallback (same version, different copy) cannot pass as sharing.
 */
async function readPageRuntimes(page) {
  return page.evaluate(() => {
    const state = window.__mfeRuntimeIdentity__;
    if (!state) {
      return null;
    }
    const pick = (role) =>
      state.instances
        .filter((instance) => instance.role === role)
        .map((instance) => ({
          id: instance.id,
          version: instance.version,
          consumers: instance.consumers.slice(),
        }));
    return { react: pick("react"), reactDom: pick("react-dom") };
  });
}

/**
 * Actual browser network data for JS assets (PRD 7.4: never infer download counts
 * from the `shared` configuration). transferSize comes from Resource-Timing, i.e.
 * what the browser really fetched.
 */
async function collectJsResourceTimings(page) {
  return page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((entry) => /\.js(\?|$)/.test(entry.name))
      .map((entry) => ({
        name: entry.name,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        duration: Math.round(entry.duration),
      }))
  );
}

module.exports = { watchErrors, openRemote, readPageRuntimes, collectJsResourceTimings };
