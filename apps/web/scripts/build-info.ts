// Writes content/generated/build-info.json at prebuild (task 2.4, DT §2.1). Every field is read from the
// repository itself; if a source is missing the build fails instead of shipping a made-up value.
// Runs with plain Node (type stripping, Node >= 22.18), so internal imports carry `.ts`.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { buildInfoSchema } from '@josecoded/types';

import type { BuildInfo } from '@josecoded/types';

export interface BuildInfoOptions {
  repoRoot: string;
  env: Record<string, string | undefined>;
}

function git(repoRoot: string, args: string[]): string {
  try {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    throw new Error(`git ${args.join(' ')} failed in ${repoRoot}: the build needs the repository history`);
  }
}

function countGatewayRoutes(repoRoot: string): number {
  const file = join(repoRoot, 'apps/api/src/routes-manifest.ts');
  if (!existsSync(file)) throw new Error(`routes-manifest not found at ${file}`);
  // The manifest is written by hand and its own test fails on drift, so reading the entries as text is enough
  // (importing a path that is only known at run time is forbidden by the lint boundaries).
  const body = readFileSync(file, 'utf8').match(/export const routes = \[([^]*?)\] as const/)?.[1] ?? '';
  const count = body.match(/\{\s*method:/g)?.length ?? 0;
  if (count === 0) throw new Error(`routes-manifest at ${file} lists no routes`);
  return count;
}

/** The migrations are the only schema source (no baseline.sql since D49); comments are ignored. */
function countSchema(repoRoot: string): { tables: number; policies: number } {
  const dir = join(repoRoot, 'supabase/migrations');
  if (!existsSync(dir)) throw new Error(`schema baseline not found: ${dir} (supabase/migrations)`);
  let tables = 0;
  let policies = 0;
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.sql'))) {
    const sql = readFileSync(join(dir, name), 'utf8').replace(/--[^\n]*/g, '');
    tables += sql.match(/^\s*create\s+table\s/gim)?.length ?? 0;
    policies += sql.match(/^\s*create\s+policy\s/gim)?.length ?? 0;
  }
  return { tables, policies };
}

/** `next` as the importer `apps/web` resolves it in pnpm-lock.yaml, without the peer suffix. */
function readNextVersion(repoRoot: string): string {
  const file = join(repoRoot, 'pnpm-lock.yaml');
  if (!existsSync(file)) throw new Error(`pnpm-lock.yaml not found at ${file}`);
  const lock = readFileSync(file, 'utf8');
  const importer = lock.match(/^ {2}apps\/web:\n((?: {4}.*\n|\n)+)/m)?.[1] ?? '';
  const version = importer.match(/^ {6}next:\n {8}specifier: .*\n {8}version: (\d+\.\d+\.\d+[^\s(]*)/m)?.[1];
  if (!version) throw new Error('next version not found for apps/web in pnpm-lock.yaml');
  return version;
}

export function computeBuildInfo({ repoRoot, env }: BuildInfoOptions): BuildInfo {
  const gatewayRoutes = countGatewayRoutes(repoRoot);
  const supabase = countSchema(repoRoot);
  const nextVersion = readNextVersion(repoRoot);

  const branch = env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME || git(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const commit = env.GITHUB_SHA ? env.GITHUB_SHA.slice(0, 7) : git(repoRoot, ['rev-parse', '--short=7', 'HEAD']);
  const reviewedAt = git(repoRoot, ['log', '-1', '--format=%cs']);

  return buildInfoSchema.parse({ branch, commit, nextVersion, gatewayRoutes, supabase, reviewedAt });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const webRoot = fileURLToPath(new URL('..', import.meta.url));
  const info = computeBuildInfo({ repoRoot: join(webRoot, '../..'), env: process.env });
  writeFileSync(join(webRoot, 'content/generated/build-info.json'), `${JSON.stringify(info, null, 2)}\n`);
  console.log(`build-info: ${info.branch}@${info.commit}, next ${info.nextVersion}, ${info.gatewayRoutes} routes, ${info.supabase.tables} tables`);
}
