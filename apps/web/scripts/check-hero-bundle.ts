// Hero bundle budget (task 2.9, DT §1.6). Reads the prerendered HTML of the home (`.next/server/app/<locale>.html`)
// and the client chunks in `.next/static/chunks`, because Turbopack writes no `app-build-manifest.json`.
// Source maps are not needed: the markers below survive minification as string literals.
//   - initial chunks (the `<script src>` and `<link rel=preload as=script>` of the HTML) must not carry `three` or
//     `@supabase/supabase-js`: both load with `import()` (hero scene, UserMenu).
//   - sceneGz: gzip of the chunk(s) that hold `three` (the dynamic scene chunk), budget 200 KB.
//   - homeGz: gzip of all initial JS of the home, budget 350 KB.
// Runs with plain Node (type stripping, Node >= 22.18), so internal imports carry `.ts`.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export const SCENE_BUDGET_GZ = 204_800;
export const HOME_BUDGET_GZ = 358_400;

/** Strings that only exist in the library they name. Looked up in the minified chunk text. */
export const THREE_MARKERS = ['WebGLRenderer', 'three.module'] as const;
export const SUPABASE_MARKERS = ['GoTrueClient', '@supabase/supabase-js'] as const;

export interface BundleInput {
  /** Prerendered HTML per page (`/`, `/en`). */
  pages: Record<string, string>;
  /** Every client chunk by its public path (`/_next/static/chunks/x.js`) to its text. */
  chunks: Record<string, string>;
}

export interface BundleReport {
  sceneGz: number;
  homeGz: number;
  /** Per page: gzip bytes of its initial JS. */
  pageGz: Record<string, number>;
  sceneChunks: string[];
  errors: string[];
}

const gz = (text: string) => gzipSync(text, { level: 9 }).length;
const hasAny = (text: string, markers: readonly string[]) => markers.some((marker) => text.includes(marker));

/** Public paths of the scripts a page loads or preloads at start (`<script src>` and `<link rel="preload" as="script">`). */
export function initialScripts(html: string): string[] {
  const found = new Set<string>();
  for (const [, src] of html.matchAll(/<script\b[^>]*?\bsrc="([^"]+)"/g)) found.add(src as string);
  for (const [tag] of html.matchAll(/<link\b[^>]*>/g)) {
    if (/\brel="preload"/.test(tag) && /\bas="script"/.test(tag)) {
      const href = /\bhref="([^"]+)"/.exec(tag)?.[1];
      if (href) found.add(href);
    }
  }
  return [...found].filter((path) => path.split('?')[0]?.endsWith('.js'));
}

export function analyzeBundle({ pages, chunks }: BundleInput): BundleReport {
  const errors: string[] = [];
  const initial = new Set<string>();
  const pageGz: Record<string, number> = {};

  for (const [page, html] of Object.entries(pages)) {
    let total = 0;
    for (const path of initialScripts(html)) {
      const text = chunks[path.split('?')[0] as string];
      if (text === undefined) {
        errors.push(`${page}: initial script ${path} is not in the build output`);
        continue;
      }
      initial.add(path.split('?')[0] as string);
      total += gz(text);
    }
    pageGz[page] = total;
  }

  for (const path of initial) {
    const text = chunks[path] as string;
    if (hasAny(text, THREE_MARKERS)) errors.push(`initial chunk ${path} contains three (it must load with import())`);
    if (hasAny(text, SUPABASE_MARKERS)) errors.push(`initial chunk ${path} contains @supabase/supabase-js (UserMenu must import() it)`);
  }

  const sceneChunks = Object.entries(chunks)
    .filter(([path, text]) => !initial.has(path) && hasAny(text, THREE_MARKERS))
    .map(([path]) => path);
  if (sceneChunks.length === 0) errors.push('no dynamic chunk holds three: the hero scene is missing or the markers changed');
  const sceneGz = sceneChunks.reduce((sum, path) => sum + gz(chunks[path] as string), 0);
  const homeGz = Math.max(0, ...Object.values(pageGz));

  if (sceneGz > SCENE_BUDGET_GZ) errors.push(`sceneGz ${sceneGz} B is over the budget of ${SCENE_BUDGET_GZ} B`);
  if (homeGz > HOME_BUDGET_GZ) errors.push(`homeGz ${homeGz} B is over the budget of ${HOME_BUDGET_GZ} B`);

  return { sceneGz, homeGz, pageGz, sceneChunks, errors };
}

/** Reads a `.next` directory. Pages are the prerendered homes; chunks are keyed by their public path. */
export function readBuild(nextDir: string, locales = ['es', 'en']): BundleInput {
  const pages: Record<string, string> = {};
  for (const locale of locales) {
    const file = join(nextDir, 'server', 'app', `${locale}.html`);
    if (!existsSync(file)) throw new Error(`${file} not found: run \`pnpm --filter web build\` first`);
    pages[locale === 'es' ? '/' : `/${locale}`] = readFileSync(file, 'utf8');
  }
  const chunks: Record<string, string> = {};
  const dir = join(nextDir, 'static', 'chunks');
  for (const name of readdirSync(dir)) {
    if (name.endsWith('.js')) chunks[`/_next/static/chunks/${name}`] = readFileSync(join(dir, name), 'utf8');
  }
  return { pages, chunks };
}

function main() {
  const nextDir = fileURLToPath(new URL('../.next', import.meta.url));
  const report = analyzeBundle(readBuild(nextDir));
  console.log(JSON.stringify({ sceneGz: report.sceneGz, homeGz: report.homeGz, pageGz: report.pageGz, sceneChunks: report.sceneChunks }, null, 2));
  if (report.errors.length > 0) {
    for (const error of report.errors) console.error(`check-hero-bundle: ${error}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
