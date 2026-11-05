import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const budgetKb = Number(process.env.JS_BUDGET_KB ?? 150);
const port = Number(process.env.BUDGET_PORT ?? 3600);
const routePath = process.env.BUDGET_PATH ?? "/es";
const externalOrigin = process.env.BUDGET_ORIGIN;
const verbose = process.argv.includes("--verbose");

async function waitFor(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`perf-budget: ${url} did not answer`);
}

function initialScripts(html) {
  const tags = html.match(/<script\b[^>]*>/g) ?? [];
  const sources = [];
  for (const tag of tags) {
    const src = /\ssrc="(\/_next\/static\/[^"]+\.js)"/.exec(tag)?.[1];
    if (!src || /\snomodule(=|\s|>)/i.test(tag)) continue;
    if (!sources.includes(src)) sources.push(src);
  }
  return sources;
}

function measure(sources) {
  return sources
    .map((src) => {
      const body = readFileSync(join(root, ".next", src.replace("/_next/", "")));
      return { src, raw: body.length, gzip: gzipSync(body, { level: 9 }).length };
    })
    .sort((a, b) => b.gzip - a.gzip);
}

let server;
let origin = externalOrigin;
if (!origin) {
  origin = `http://localhost:${port}`;
  server = spawn(
    process.execPath,
    [join(root, "node_modules/next/dist/bin/next"), "start", "--port", String(port)],
    {
      cwd: root,
      stdio: "ignore",
      env: { ...process.env, ENABLE_DEV_PAGES: "true" },
    },
  );
}

let failed = false;
try {
  const response = await waitFor(`${origin}${routePath}`);
  const sources = initialScripts(await response.text());
  const files = measure(sources);
  const totalGzip = files.reduce((sum, file) => sum + file.gzip, 0);
  const totalRaw = files.reduce((sum, file) => sum + file.raw, 0);
  if (verbose) {
    for (const file of files) {
      console.log(
        `${(file.gzip / 1024).toFixed(1).padStart(7)} KB gz  ${(file.raw / 1024).toFixed(1).padStart(7)} KB raw  ${file.src}`,
      );
    }
  }
  const totalKb = totalGzip / 1024;
  console.log(
    `perf-budget: ${routePath} ships ${files.length} scripts, ${totalKb.toFixed(1)} KB gz (${(totalRaw / 1024).toFixed(1)} KB raw), budget ${budgetKb} KB gz`,
  );
  if (totalKb > budgetKb) {
    console.error(`perf-budget: over budget by ${(totalKb - budgetKb).toFixed(1)} KB gz`);
    failed = true;
  }
} finally {
  server?.kill();
}
process.exit(failed ? 1 : 0);
