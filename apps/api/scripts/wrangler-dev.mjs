#!/usr/bin/env node
/**
 * `pnpm dev` -> `wrangler dev` with the bindings of `.dev.vars` (Supabase local: see `.dev.vars.example`).
 * Extra arguments are forwarded (`pnpm dev -- --test-scheduled` exposes `/__scheduled` to fire the cron).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = ['exec', 'wrangler', 'dev', ...process.argv.slice(2)];

const child = spawn('pnpm', args, {
  stdio: 'inherit',
  cwd: root,
  env: process.env,
  shell: false,
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
