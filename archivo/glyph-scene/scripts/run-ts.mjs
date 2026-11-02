// Runs a TypeScript script of this package with plain Node: src/ imports are extensionless (bundler resolution),
// which Node's type stripping cannot follow, so the entry is bundled by esbuild first (packages stay external).
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entry = process.argv[2];
if (!entry) {
  console.error('usage: node scripts/run-ts.mjs <script.ts> [args]');
  process.exit(2);
}
// Inside node_modules (ignored by git) so the external packages resolve from the bundle's location.
const cache = join(root, 'node_modules/.cache');
mkdirSync(cache, { recursive: true });
const out = mkdtempSync(join(cache, 'run-'));
const outfile = join(out, 'main.mjs');
// Scripts may call process.exit(); 'exit' handlers run synchronously, so the bundle dir never outlives the process.
process.on('exit', () => rmSync(out, { recursive: true, force: true }));
try {
  await build({
    entryPoints: [resolve(root, entry)],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    // Workspace packages (TypeScript sources) are bundled; everything else resolves from node_modules.
    external: ['esbuild', 'playwright', 'sharp', 'three', '@types/*'],
    logLevel: 'warning',
  });
  process.env['GLYPH_SCENE_ROOT'] = root;
  process.argv.splice(1, 2, entry);
  await import(pathToFileURL(outfile).href);
} finally {
  // The scripts use top-level await, so the import above resolves only when they are done.
  rmSync(out, { recursive: true, force: true });
}
