#!/usr/bin/env node
// Fails the build if the deployable bundle (dist/index.js) still contains the test hooks.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bundle = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.js');
const text = readFileSync(bundle, 'utf8');
const leaked = ['__deps', '__TEST_HOOKS__'].filter((needle) => text.includes(needle));

if (leaked.length > 0) {
  console.error(`dist/index.js contains test hooks: ${leaked.join(', ')}`);
  process.exit(1);
}
console.log('dist/index.js has no test hooks');
