#!/usr/bin/env node
// Fails the build if a deployable bundle (<dir>/index.js, default dist) still contains the test hooks.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dirs = process.argv.length > 2 ? process.argv.slice(2) : ['dist'];
let failed = false;

for (const dir of dirs) {
  const text = readFileSync(join(root, dir, 'index.js'), 'utf8');
  const leaked = ['__deps', '__TEST_HOOKS__'].filter((needle) => text.includes(needle));
  if (leaked.length > 0) {
    console.error(`${dir}/index.js contains test hooks: ${leaked.join(', ')}`);
    failed = true;
  } else {
    console.log(`${dir}/index.js has no test hooks`);
  }
}
if (failed) process.exit(1);
