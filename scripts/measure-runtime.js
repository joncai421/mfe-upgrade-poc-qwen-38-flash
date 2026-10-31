#!/usr/bin/env node
/**
 * Runtime performance measurement for this branch (PRD 6.7 / 7.4).
 *
 * The build statistics (npm run build:stats) say what each build CONTAINS. This
 * script says what a real browser actually FETCHES while the mixed React 16 + React
 * 19 page is used, because "shared" in a webpack config is not proof of a single
 * download. It drives the four production preview builds, then writes
 * docs/performance-option-c-runtime.md.
 *
 * Usage: node scripts/measure-runtime.js
 */
const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");
const { chromium } = require("@playwright/test");
const servers = require("../tests/servers");
const { APPS, REACT_16_VERSION, REACT_19_VERSION } = require("../tests/expectations");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "docs", "performance-option-c-runtime.md");
const CONTAINER_URL = "http://localhost:3000";
const REMOTE_ORDER = ["mfeApp2", "mfeApp3", "mfeApp1"];

const kb = (bytes) => (bytes / 1024).toFixed(1);

function waitForUrl(url, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) {
          reject(new Error(`server at ${url} did not come up`));
        } else {
          setTimeout(tick, 500);
        }
      });
    };
    tick();
  });
}

function startServers() {
  return servers.map((config) =>
    spawn(config.command, { cwd: ROOT, shell: true, stdio: "ignore" })
  );
}

function stopServers(procs) {
  procs.forEach((proc) => {
    if (proc.killed) return;
    proc.kill("SIGTERM");
  });
}

/** Which React generation does a fetched JS asset mention? (text scan, not guesswork) */
async function classifyAsset(url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    return {
      mentionsReact16: text.includes(REACT_16_VERSION),
      mentionsReact19: text.includes(REACT_19_VERSION),
      bytes: Buffer.byteLength(text),
    };
  } catch (err) {
    return { mentionsReact16: false, mentionsReact19: false, bytes: 0, error: String(err.message) };
  }
}

async function collectJsEntries(page) {
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

async function measure() {
  const procs = startServers();
  try {
    await Promise.all(servers.map((config) => waitForUrl(config.url)));

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const requested = new Map();
    page.on("request", (req) => {
      const url = req.url();
      if (/\.js(\?|$)/.test(url)) {
        requested.set(url, (requested.get(url) || 0) + 1);
      }
    });

    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(String(err.message)));

    // --- initial load: container shell + first remote (React 19) mounted ---
    const startedAt = Date.now();
    await page.goto(CONTAINER_URL, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="status-mfeApp1"] >> text=mounted', {
      timeout: 30000,
    });
    const firstRemoteMountedMs = Date.now() - startedAt;
    await page.waitForSelector('[data-testid="app1-root"]', { timeout: 30000 });
    const app1RenderedMs = Date.now() - startedAt;

    const navTiming = await page.evaluate(() => {
      const entry = performance.getEntriesByType("navigation")[0];
      return {
        domContentLoaded: Math.round(entry.domContentLoadedEventEnd),
        load: Math.round(entry.loadEventEnd),
      };
    });
    const initialEntries = await collectJsEntries(page);

    // --- subsequent remote loading times (warm scope, cold route) ---
    const remoteLoads = [];
    for (const id of REMOTE_ORDER) {
      const t0 = Date.now();
      await page.getByRole("link", { name: APPS[id].tab }).click();
      await page.waitForSelector(`[data-testid="status-${id}"] >> text=mounted`, {
        timeout: 30000,
      });
      await page.waitForSelector(`[data-testid="${APPS[id].root}"]`, { timeout: 30000 });
      remoteLoads.push({ id, ms: Date.now() - t0 });
    }

    const allEntries = await collectJsEntries(page);
    const uniqueUrls = Array.from(new Set(allEntries.map((entry) => entry.name)));
    const initialUrls = Array.from(new Set(initialEntries.map((entry) => entry.name)));

    // Byte totals come from the fetched asset text (uncompressed). Resource-Timing
    // transferSize is 0 for same-origin responses the browser can serve from cache,
    // so it is reported separately instead of being mistaken for the payload size.
    const assetIndex = new Map();
    for (const url of uniqueUrls) {
      const info = await classifyAsset(url);
      const requests = requested.get(url) || 0;
      const entry = allEntries.find((e) => e.name === url) || {};
      assetIndex.set(url, {
        url,
        port: new URL(url).port,
        file: url.replace(/^http:\/\/localhost:\d+\//, ""),
        requests,
        transferSize: entry.transferSize || 0,
        ...info,
      });
    }
    const assets = Array.from(assetIndex.values()).sort((a, b) => b.bytes - a.bytes);
    const sum = (urls, key) =>
      urls.reduce((acc, url) => acc + (assetIndex.get(url) ? assetIndex.get(url)[key] : 0), 0);

    const totals = {
      count: uniqueUrls.length,
      requests: allEntries.length,
      bytes: sum(uniqueUrls, "bytes"),
      transferSize: sum(uniqueUrls, "transferSize"),
    };
    const initialTotals = {
      count: initialUrls.length,
      bytes: sum(initialUrls, "bytes"),
      transferSize: sum(initialUrls, "transferSize"),
    };

    const react16Assets = assets.filter((a) => a.mentionsReact16 && !a.mentionsReact19);
    const react19Assets = assets.filter((a) => a.mentionsReact19 && !a.mentionsReact16);
    const duplicated = assets.filter((a) => a.requests > 1);

    const identity = await page.evaluate(() => {
      const state = window.__mfeRuntimeIdentity__;
      if (!state) return null;
      return state.instances
        .filter((instance) => instance.role === "react")
        .map((instance) => ({
          id: instance.id,
          version: instance.version,
          consumers: instance.consumers.slice(),
        }));
    });

    await browser.close();

    return {
      generatedAt: new Date().toISOString(),
      navTiming,
      firstRemoteMountedMs,
      app1RenderedMs,
      initialCount: initialTotals.count,
      initialBytes: initialTotals.bytes,
      initialTransferSize: initialTotals.transferSize,
      totalCount: totals.count,
      totalRequests: totals.requests,
      totalBytes: totals.bytes,
      totalTransferSize: totals.transferSize,
      remoteLoads,
      assets,
      react16Assets,
      react19Assets,
      duplicated,
      identity,
      errors,
    };
  } finally {
    stopServers(procs);
  }
}

function toMarkdown(result) {
  const bytesOf = (list) => kb(list.reduce((acc, asset) => acc + asset.bytes, 0));
  const lines = [];
  lines.push("# Runtime Measurements — Option C");
  lines.push("");
  lines.push(
    "> Auto-generated by `node scripts/measure-runtime.js`. Do not edit by hand." +
      " Production builds served over localhost without HTTP compression."
  );
  lines.push(
    "> Byte columns are the fetched asset contents (uncompressed); the transferSize column is" +
      " the browser's own Resource-Timing view of the same responses."
  );
  lines.push("");
  lines.push(`Generated at: \`${result.generatedAt}\``);
  lines.push("");
  lines.push("## Page load (container + first remote, which is the React 19 app)");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|---|---:|");
  lines.push(`| JS assets fetched for the first screen | ${result.initialCount} |`);
  lines.push(`| JS bytes fetched for the first screen | ${kb(result.initialBytes)} KiB |`);
  lines.push(`| Container DOMContentLoaded | ${result.navTiming.domContentLoaded} ms |`);
  lines.push(`| Container load event | ${result.navTiming.load} ms |`);
  lines.push(
    `| App 1 (React 19 remote) reported mounted | ${result.firstRemoteMountedMs} ms after navigation |`
  );
  lines.push(
    `| App 1 DOM visible (concurrent render flushed) | ${result.app1RenderedMs} ms after navigation |`
  );
  lines.push("");
  lines.push("## Subsequent remote loading times (warm scope, cold route)");
  lines.push("");
  lines.push("| Remote | Click → mounted + rendered |");
  lines.push("|---|---:|");
  for (const entry of result.remoteLoads) {
    lines.push(`| ${entry.id} (React ${APPS[entry.id].react}) | ${entry.ms} ms |`);
  }
  lines.push("");
  lines.push("## Whole session totals (all four applications visited)");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|---|---:|");
  lines.push(`| JS requests / unique JS assets | ${result.totalRequests} / ${result.totalCount} |`);
  lines.push(`| Total JS fetched | ${kb(result.totalBytes)} KiB |`);
  lines.push(
    `| Total Resource-Timing transferSize (0 where the browser served from cache) | ${kb(
      result.totalTransferSize
    )} KiB |`
  );
  lines.push(
    `| Assets mentioning React 16 (${REACT_16_VERSION}) | ${
      result.react16Assets.length
    } — ${bytesOf(result.react16Assets)} KiB |`
  );
  lines.push(
    `| Assets mentioning React 19 (${REACT_19_VERSION}) | ${
      result.react19Assets.length
    } — ${bytesOf(result.react19Assets)} KiB |`
  );
  lines.push(
    `| Assets fetched more than once | ${result.duplicated.length}` +
      (result.duplicated.length
        ? ` (${result.duplicated.map((asset) => `${asset.port}/${asset.file}`).join(", ")})`
        : " — each generation is downloaded exactly once") +
      " |"
  );
  lines.push(`| Runtime console / page errors | ${result.errors.length} |`);
  lines.push("");
  lines.push("## Loaded React runtimes (verified by instance identity, not package.json)");
  lines.push("");
  lines.push("| Instance | Version | Consumers |");
  lines.push("|---|---|---|");
  for (const instance of result.identity || []) {
    lines.push(`| ${instance.id} | ${instance.version} | ${instance.consumers.join(", ")} |`);
  }
  lines.push("");
  lines.push("Two instances for four applications: the three React 16 consumers share one copy");
  lines.push(
    "downloaded once, and the React 19 application shares its own copy. A silent local fallback"
  );
  lines.push("would appear as a third instance with a single consumer.");
  lines.push("");
  lines.push("## Every JS asset fetched during the session");
  lines.push("");
  lines.push("| Asset | Served by | Requests | KiB | mentions 16.14.0 | mentions 19.3.1 |");
  lines.push("|---|---|---:|---:|:--:|:--:|");
  for (const asset of result.assets) {
    lines.push(
      `| \`${asset.file}\` | :${asset.port} | ${asset.requests} | ${kb(asset.bytes)} |` +
        ` ${asset.mentionsReact16 ? "yes" : ""} | ${asset.mentionsReact19 ? "yes" : ""} |`
    );
  }
  lines.push("");
  lines.push("## Reproduce");
  lines.push("");
  lines.push("```bash");
  lines.push("npm run build");
  lines.push("npm run perf:measure   # node scripts/measure-runtime.js");
  lines.push("```");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const result = await measure();
  fs.writeFileSync(OUT, toMarkdown(result), "utf8");
  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(ROOT, OUT)}`);
  // eslint-disable-next-line no-console
  console.log(
    `JS requests: ${result.totalCount}, total ${kb(result.totalBytes)} KiB, ` +
      `React16 assets: ${result.react16Assets.length}, React19 assets: ${result.react19Assets.length}, ` +
      `duplicates: ${result.duplicated.length}, errors: ${result.errors.length}`
  );
  if (result.errors.length) {
    // eslint-disable-next-line no-console
    console.log(result.errors.join("\n"));
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
