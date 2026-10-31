#!/usr/bin/env node
/**
 * Collects Webpack production build statistics from each application's
 * `.stats-build-stats.json` (written by `npm run build:stats`) and the emitted
 * `dist/` assets, then regenerates the performance document for the CURRENT branch.
 *
 * Produces the reference measurements required by PRD 4.5 / 5.6 / 6.7 / 7.4:
 *   - initial JS bundle size per application (raw + gzipped)
 *   - shared react / react-dom contribution (from webpack module graph)
 *   - remoteEntry.js transfer size for each remote
 *   - asset/request counts
 *
 * The output document is derived from the sharing configuration the branch actually
 * declares, so this command can never overwrite another branch's measurements: the
 * React 16 singleton baseline writes docs/performance-baseline.md, while a build set
 * that keeps two React generations in the default scope writes
 * docs/performance-option-c.md.
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { ModuleFederationPlugin } = require("webpack").container;

const ROOT = path.resolve(__dirname, "..");
const APPS = [
  { dir: "container-app", name: "containerApp", remote: false },
  { dir: "mfe-app-1", name: "mfeApp1", remote: true },
  { dir: "mfe-app-2", name: "mfeApp2", remote: true },
  { dir: "mfe-app-3", name: "mfeApp3", remote: true },
];

const kb = (bytes) => (bytes / 1024).toFixed(1);

/** Read one build's federation options straight from its webpack.config.js. */
function federationOptions(dir) {
  // eslint-disable-next-line global-require
  const config = require(path.join(ROOT, dir, "webpack.config.js"));
  const plugin = config.plugins.find((p) => p instanceof ModuleFederationPlugin);
  return plugin.options;
}

/**
 * Which measurement document does this branch own?
 * Detected from the sharing config instead of a hand-set flag, so the answer cannot
 * drift from what the builds really do.
 */
function detectMode() {
  const versions = APPS.map((app) => {
    const shared = federationOptions(app.dir).shared.react;
    return { dir: app.dir, version: shared.version, singleton: shared.singleton };
  });
  const distinct = Array.from(new Set(versions.map((v) => v.version))).sort();
  const anySingletonFalse = versions.some((v) => v.singleton === false);

  if (distinct.length > 1 && !anySingletonFalse) {
    throw new Error(
      "detectMode(): several React generations are present but singleton is enabled — refusing to guess the document"
    );
  }

  if (distinct.length === 1 && distinct[0].startsWith("16.")) {
    return {
      file: "performance-baseline.md",
      title: "Performance Baseline (Part 1 — React 16)",
      sharingNote:
        "Because `singleton: true` shares one React 16.14.0 across the page, these sizes are" +
        " counted per build; at runtime a compatible provider is loaded once and consumed by all.",
    };
  }

  return {
    file: "performance-option-c.md",
    title: "Performance Comparison — Option C (React 16 + React 19 in the default share scope)",
    sharingNote:
      "All four builds share the ONE default scope with `singleton: false`, so two React" +
      " generations are registered at once. `react modules` / `react-dom modules` below are the" +
      " per-generation sizes each build contributes; at runtime one provider per generation is" +
      " downloaded and consumed by every application of that generation (verified against the" +
      " browser network log in docs/performance-option-c-runtime.md).",
  };
}

function gzipSize(filePath) {
  return zlib.gzipSync(fs.readFileSync(filePath)).length;
}

function sumModuleSize(stats, matcher) {
  if (!stats || !Array.isArray(stats.modules)) return 0;
  return stats.modules
    .filter((m) => m && m.name && matcher(m.name))
    .reduce((acc, m) => acc + (typeof m.size === "number" ? m.size : 0), 0);
}

function collect(app) {
  const statsPath = path.join(ROOT, app.dir, ".stats-build-stats.json");
  const distDir = path.join(ROOT, app.dir, "dist");
  if (!fs.existsSync(statsPath)) {
    throw new Error(`Missing ${statsPath}. Run "npm run build:stats" first.`);
  }
  const stats = JSON.parse(fs.readFileSync(statsPath, "utf8"));

  const jsAssets = (stats.assets || []).filter((a) => /\.js$/.test(a.name));
  const totalRaw = jsAssets.reduce((acc, a) => acc + a.size, 0);

  let totalGzip = 0;
  const assetRows = [];
  for (const a of jsAssets) {
    const file = path.join(distDir, a.name);
    const gz = fs.existsSync(file) ? gzipSize(file) : 0;
    totalGzip += gz;
    assetRows.push({ name: a.name, raw: a.size, gzip: gz });
  }
  assetRows.sort((x, y) => y.raw - x.raw);

  const reactSize = sumModuleSize(stats, (n) => /node_modules[\\/]react[\\/]/.test(n));
  const reactDomSize = sumModuleSize(stats, (n) => /node_modules[\\/]react-dom[\\/]/.test(n));
  const remoteEntry = jsAssets.find((a) => a.name === "remoteEntry.js");
  const mainEntry = jsAssets.find((a) => a.name === "main.js");

  return {
    ...app,
    totalRaw,
    totalGzip,
    requestCount: jsAssets.length,
    reactSize,
    reactDomSize,
    remoteEntryRaw: remoteEntry ? remoteEntry.size : null,
    mainRaw: mainEntry ? mainEntry.size : null,
    topAssets: assetRows.slice(0, 5),
  };
}

function buildMarkdown(results, mode) {
  const generatedAt = new Date().toISOString();
  const lines = [];
  lines.push(`# ${mode.title}`);
  lines.push("");
  lines.push(
    "> Auto-generated by `npm run build:stats`. Do not edit by hand."
  );
  lines.push("");
  lines.push(`Generated at: \`${generatedAt}\``);
  lines.push("");
  lines.push("Build mode: **production** (minimized). Sizes in KiB. Gzipped sizes measured with `zlib`.");
  lines.push("");
  lines.push("## Per-application totals");
  lines.push("");
  lines.push("| Application | JS assets | Total JS (raw) | Total JS (gzip) | Initial requests |");
  lines.push("|---|---:|---:|---:|---:|");
  for (const r of results) {
    lines.push(
      `| ${r.name} (${r.dir}) | ${r.requestCount} | ${kb(r.totalRaw)} | ${kb(r.totalGzip)} | ${r.requestCount} |`
    );
  }
  lines.push("");
  lines.push("## Shared React runtime contribution (from webpack module graph)");
  lines.push("");
  lines.push(mode.sharingNote);
  lines.push("");
  lines.push("| Application | react modules | react-dom modules |");
  lines.push("|---|---:|---:|");
  for (const r of results) {
    lines.push(`| ${r.name} | ${kb(r.reactSize)} | ${kb(r.reactDomSize)} |`);
  }
  lines.push("");
  lines.push("## Federation entry sizes");
  lines.push("");
  lines.push("| Application | remoteEntry.js (raw) | main.js (raw) |");
  lines.push("|---|---:|---:|");
  for (const r of results) {
    lines.push(
      `| ${r.name} | ${r.remoteEntryRaw != null ? kb(r.remoteEntryRaw) : "n/a (host)"} | ${
        r.mainRaw != null ? kb(r.mainRaw) : "n/a"
      } |`
    );
  }
  lines.push("");
  lines.push("## Largest JS assets per application");
  lines.push("");
  for (const r of results) {
    lines.push(`### ${r.name}`);
    lines.push("");
    lines.push("| Asset | Raw (KiB) | Gzip (KiB) |");
    lines.push("|---|---:|---:|");
    for (const a of r.topAssets) {
      lines.push(`| ${a.name} | ${kb(a.raw)} | ${kb(a.gzip)} |`);
    }
    lines.push("");
  }
  lines.push("## Reproduce");
  lines.push("");
  lines.push("```bash");
  lines.push("npm run build:stats");
  lines.push("```");
  lines.push("");
  lines.push(
    "Loading-time and network-request measurements for the running page are captured by the" +
      " Playwright integration/E2E suites (see docs/testing-guide.md)."
  );
  lines.push("");
  return lines.join("\n");
}

function main() {
  const mode = detectMode();
  const results = APPS.map(collect);
  const md = buildMarkdown(results, mode);
  const outPath = path.join(ROOT, "docs", mode.file);
  fs.writeFileSync(outPath, md, "utf8");
  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(ROOT, outPath)} (${mode.title})`);
  // eslint-disable-next-line no-console
  console.table(
    results.map((r) => ({
      app: r.name,
      jsAssets: r.requestCount,
      totalRawKiB: kb(r.totalRaw),
      totalGzipKiB: kb(r.totalGzip),
    }))
  );
}

main();
