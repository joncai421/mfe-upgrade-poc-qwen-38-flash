#!/usr/bin/env node
/**
 * Option B runtime performance measurement (PRD 5.6 / 7.4).
 *
 * Loads the real container with all four PRODUCTION builds in a headless
 * browser and measures what the page ACTUALLY downloads — request counts and
 * transfer sizes per application, initial vs lazy loads, remote mount times and
 * console errors. Sharing claims are verified from the network log and from the
 * webpack module graph (which emitted asset carries react/react-dom), never from
 * the `shared` configuration alone.
 *
 * Writes docs/performance-option-b-runtime.md. Requires `npm run build` first.
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("@playwright/test");

const ROOT = path.resolve(__dirname, "..");
const APPS = [
  { dir: "container-app", name: "containerApp", port: 3000, scope: "react16" },
  { dir: "mfe-app-1", name: "mfeApp1", port: 3001, scope: "react19" },
  { dir: "mfe-app-2", name: "mfeApp2", port: 3002, scope: "react16" },
  { dir: "mfe-app-3", name: "mfeApp3", port: 3003, scope: "react16" },
];
const OUT = path.join(ROOT, "docs", "performance-option-b-runtime.md");
const kb = (bytes) => (bytes / 1024).toFixed(1);

/** Maps "port/asset.js" -> true when that asset carries real react / react-dom code. */
function reactAssetsByApp() {
  const map = {};
  const wrapper = /^(provide|consume) shared(\s|$)/;
  for (const app of APPS) {
    const statsPath = path.join(ROOT, app.dir, ".stats-build-stats.json");
    if (!fs.existsSync(statsPath)) continue;
    const stats = JSON.parse(fs.readFileSync(statsPath, "utf8"));
    for (const chunk of stats.chunks || []) {
      const isReact = (chunk.modules || []).some(
        (m) =>
          !wrapper.test(m.name || "") &&
          /[\\/]node_modules[\\/](react|react-dom)[\\/]/.test(m.name || "")
      );
      for (const file of chunk.files || []) {
        if (/\.js$/.test(file)) map[`${app.port}/${file}`] = isReact;
      }
    }
  }
  return map;
}

function startServers() {
  const children = APPS.map((app) =>
    spawn("npm", ["run", "preview", "-w", app.dir], { cwd: ROOT, stdio: "ignore" })
  );
  const wait = (port) =>
    new Promise((resolve, reject) => {
      const deadline = Date.now() + 120000;
      const attempt = () => {
        const req = require("http").get(`http://localhost:${port}/`, (res) => {
          res.resume();
          res.statusCode < 500 ? resolve() : setTimeout(attempt, 500);
        });
        req.on("error", () => (Date.now() > deadline ? reject(new Error(`port ${port} down`)) : setTimeout(attempt, 500)));
      };
      attempt();
    });
  return Promise.all(APPS.map((a) => wait(a.port))).then(() => children);
}

async function main() {
  const children = await startServers();
  const reactAssets = reactAssetsByApp();
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  const failedRequests = [];
  const downloads = []; // { url, port, file, bytes, isReact, phase }
  let phase = "initial";

  page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
  page.on("pageerror", (err) => errors.push(String(err.message || err)));
  page.on("requestfailed", (req) => {
    const f = req.failure();
    if (!/favicon/i.test(req.url()) && f && !/ERR_ABORTED/i.test(f.errorText || "")) {
      failedRequests.push(`${req.url()} :: ${f.errorText}`);
    }
  });
  page.on("response", (res) => {
    const url = res.url();
    if (!/\.js(\?|$)/.test(url)) return;
    const match = url.match(/^http:\/\/localhost:(\d+)\/([^/?#]+)$/);
    if (!match) return;
    // Prefer the advertised transfer size; fall back to buffering the body.
    const announced = Number(res.headers()["content-length"] || 0);
    const sizePromise = announced
      ? Promise.resolve(announced)
      : res
          .body()
          .then((b) => b.length)
          .catch(() => 0);
    sizePromise.then((bytes) => {
      const key = `${match[1]}/${match[2]}`;
      downloads.push({
        port: match[1],
        file: match[2],
        bytes,
        isReact: reactAssets[key] === true,
        scope: (APPS.find((a) => String(a.port) === match[1]) || {}).scope || "?",
        phase,
      });
    });
  });

  const t0 = Date.now();
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  const domReady = Date.now() - t0;
  await page.waitForSelector('[data-testid="app-shell"]');
  const shellVisible = Date.now() - t0;
  await page.waitForSelector('[data-testid="status-mfeApp1"] >> text=mounted', { timeout: 30000 });
  const firstRemoteMounted = Date.now() - t0;

  const remoteTimes = {};
  for (const [label, id] of [["App 2", "mfeApp2"], ["App 3", "mfeApp3"]]) {
    phase = id;
    const start = Date.now();
    await page.getByRole("link", { name: new RegExp(label) }).click();
    await page.waitForSelector(`[data-testid="status-${id}"] >> text=mounted`, { timeout: 30000 });
    remoteTimes[id] = Date.now() - start;
  }

  // Runtime versions reported by the applications themselves (context for sizes).
  phase = "diagnostics";
  await page.getByRole("link", { name: /Diagnostics/ }).click();
  await page.waitForSelector('[data-testid="runtime-mfeApp3"]', { timeout: 30000 });
  const runtimes = {};
  for (const id of ["containerApp", "mfeApp1", "mfeApp2", "mfeApp3"]) {
    const row = page.getByTestId(`runtime-${id}`).first();
    runtimes[id] = {
      react: await row.getAttribute("data-react-version"),
      scope: await row.getAttribute("data-share-scope"),
      shares: await row.getAttribute("data-shares-container-runtime"),
    };
  }

  await browser.close();
  children.forEach((child) => child.kill("SIGTERM"));
  // Let any in-flight size promises settle before aggregating.
  await new Promise((resolve) => setTimeout(resolve, 500));

  const totalBytes = downloads.reduce((acc, d) => acc + d.bytes, 0);
  const initialBytes = downloads.filter((d) => d.phase === "initial").reduce((a, d) => a + d.bytes, 0);
  const byScope = {};
  for (const d of downloads) {
    byScope[d.scope] = byScope[d.scope] || { requests: 0, bytes: 0, reactBytes: 0 };
    byScope[d.scope].requests += 1;
    byScope[d.scope].bytes += d.bytes;
    if (d.isReact) byScope[d.scope].reactBytes += d.bytes;
  }
  const reactDownloads = downloads.filter((d) => d.isReact);
  const perPort = {};
  for (const d of downloads) {
    perPort[d.port] = perPort[d.port] || { requests: 0, bytes: 0 };
    perPort[d.port].requests += 1;
    perPort[d.port].bytes += d.bytes;
  }

  const lines = [];
  lines.push("# Performance — Option B runtime measurements");
  lines.push("");
  lines.push(
    "> Auto-generated by `npm run perf:option-b` against production builds (`npm run preview`). Do not edit by hand."
  );
  lines.push("");
  lines.push(`Generated at: \`${new Date().toISOString()}\``);
  lines.push("");
  lines.push(
    "Transfer sizes are uncompressed: the static preview server does not gzip. Compare them with the" +
      " gzipped build sizes in `docs/performance-option-b.md` to estimate the effect of a real CDN."
  );
  lines.push("");
  lines.push("## Load timings (ms, from navigation start)");
  lines.push("");
  lines.push("| Milestone | ms |");
  lines.push("|---|---:|");
  lines.push(`| DOMContentLoaded | ${domReady} |`);
  lines.push(`| Container shell visible | ${shellVisible} |`);
  lines.push(`| First remote (App 1, React 19) mounted | ${firstRemoteMounted} |`);
  lines.push(`| App 2 mounted after navigation | ${remoteTimes.mfeApp2} |`);
  lines.push(`| App 3 mounted after navigation | ${remoteTimes.mfeApp3} |`);
  lines.push("");
  lines.push("## JavaScript actually downloaded");
  lines.push("");
  lines.push("| Origin | Requests | Transfer (KiB) | Share scope |");
  lines.push("|---|---:|---:|---|");
  for (const [port, v] of Object.entries(perPort).sort()) {
    const scope = (APPS.find((a) => String(a.port) === port) || {}).scope || "?";
    lines.push(`| localhost:${port} | ${v.requests} | ${kb(v.bytes)} | ${scope} |`);
  }
  lines.push(`| **Total** | **${downloads.length}** | **${kb(totalBytes)}** |  |`);
  lines.push("");
  lines.push("| Share scope | Requests | Total JS (KiB) | of which React runtime (KiB) |");
  lines.push("|---|---:|---:|---:|");
  for (const [scope, v] of Object.entries(byScope)) {
    lines.push(`| ${scope} | ${v.requests} | ${kb(v.bytes)} | ${kb(v.reactBytes)} |`);
  }
  lines.push("");
  lines.push(`Initial page load transferred **${kb(initialBytes)} KiB** of JavaScript.`);
  lines.push("");
  lines.push("## React runtime assets downloaded (deduplication evidence)");
  lines.push("");
  lines.push(
    "Each row is an emitted asset that contains `react` or `react-dom` modules in that build's module graph," +
      " and whether the browser really downloaded it."
  );
  lines.push("");
  lines.push("| Asset | Share scope | Transfer (KiB) | Downloaded in phase |");
  lines.push("|---|---|---:|---|");
  for (const d of reactDownloads) {
    lines.push(`| localhost:${d.port}/${d.file} | ${d.scope} | ${kb(d.bytes)} | ${d.phase} |`);
  }
  lines.push("");
  const react16Copies = reactDownloads.filter((d) => d.scope === "react16").length;
  const react19Copies = reactDownloads.filter((d) => d.scope === "react19").length;
  lines.push(
    `React 16 assets downloaded: **${react16Copies}** (three applications share the react16 scope). ` +
      `React 19 assets downloaded: **${react19Copies}** (App 1 is currently the only react19 consumer).`
  );
  lines.push("");
  lines.push("## Reported runtimes (same page, same moment)");
  lines.push("");
  lines.push("| Application | React | Share scope | Shares container instance |");
  lines.push("|---|---|---|---|");
  for (const [id, r] of Object.entries(runtimes)) {
    lines.push(`| ${id} | ${r.react} | ${r.scope} | ${r.shares || "n/a"} |`);
  }
  lines.push("");
  lines.push("## Runtime errors during the measurement");
  lines.push("");
  lines.push(errors.length ? "```\n" + errors.join("\n") + "\n```" : "None — no console errors or page errors.");
  lines.push("");
  lines.push(failedRequests.length ? `Failed requests:\n\n- ${failedRequests.join("\n- ")}` : "No failed requests.");
  lines.push("");
  lines.push("## Reproduce");
  lines.push("");
  lines.push("```bash");
  lines.push("npm run build");
  lines.push("npm run perf:option-b");
  lines.push("```");
  lines.push("");

  fs.writeFileSync(OUT, lines.join("\n"), "utf8");
  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(ROOT, OUT)}`);
  // eslint-disable-next-line no-console
  console.log(
    `requests=${downloads.length} totalJS=${kb(totalBytes)}KiB react16Copies=${react16Copies} react19Copies=${react19Copies} errors=${errors.length}`
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
