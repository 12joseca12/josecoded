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

/**
 * Removes comments while leaving string literals untouched, so `--` or `/*` inside `'...'`, `"..."` or a
 * backtick string survive. Block comments nest (Postgres does; for TS it is harmless). Dollar-quoted bodies
 * are not strings here: they are scanned as code, which is what the migrations that use them expect.
 */
export function stripComments(text: string, line: '--' | '//'): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i] as string;
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < text.length) {
        if (text[j] === ch) {
          if (text[j + 1] === ch) j += 2; // doubled quote is an escape
          else break;
        } else if (text[j] === '\\' && ch !== "'" && line === '//') j += 2;
        else j += 1;
      }
      out += text.slice(i, j + 1);
      i = j + 1;
    } else if (text.startsWith('/*', i)) {
      let depth = 1;
      let j = i + 2;
      while (j < text.length && depth > 0) {
        if (text.startsWith('/*', j)) {
          depth += 1;
          j += 2;
        } else if (text.startsWith('*/', j)) {
          depth -= 1;
          j += 2;
        } else j += 1;
      }
      out += ' ';
      i = j;
    } else if (text.startsWith(line, i)) {
      while (i < text.length && text[i] !== '\n') i += 1;
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
}

/**
 * Counts the entries of `routes` in the hand-written manifest (importing a path only known at run time is
 * forbidden by the lint boundaries). Each `{ ... }` entry must carry both `method` and `path`, in any order;
 * anything else fails loudly instead of under-counting.
 */
export function countRoutesIn(source: string, where = 'routes-manifest'): number {
  const code = stripComments(source, '//');
  const array = code.match(/export const routes\b[^=]*=\s*\[([^]*?)\]\s*as const/)?.[1];
  if (array === undefined) throw new Error(`${where}: \`export const routes = [...] as const\` not found`);
  // Strings blanked so braces or commas inside a path cannot confuse the entry scan.
  const flat = array.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '""');
  const entries = flat.match(/\{[^{}]*\}/g) ?? [];
  for (const entry of entries) {
    if (!/\bmethod\s*:/.test(entry) || !/\bpath\s*:/.test(entry)) {
      throw new Error(`${where}: entry without method and path: ${entry.replace(/\s+/g, ' ')}`);
    }
  }
  if (entries.length === 0) throw new Error(`${where} lists no routes`);
  // Anything outside the entries (besides commas and whitespace) means the scan did not understand the file.
  if (flat.replace(/\{[^{}]*\}/g, '').replace(/[\s,]/g, '') !== '') throw new Error(`${where}: unexpected content between entries`);
  return entries.length;
}

function countGatewayRoutes(repoRoot: string): number {
  const file = join(repoRoot, 'apps/api/src/routes-manifest.ts');
  if (!existsSync(file)) throw new Error(`routes-manifest not found at ${file}`);
  return countRoutesIn(readFileSync(file, 'utf8'), file);
}

const NAME = String.raw`((?:"[^"]+"|[\w$]+)(?:\s*\.\s*(?:"[^"]+"|[\w$]+))?)`;

function normalizeName(raw: string): string {
  const parts = raw.split('.').map((p) => p.trim().replace(/^"|"$/g, '').toLowerCase());
  return parts.length === 1 ? `public.${parts[0]}` : parts.join('.');
}

/**
 * Tables and policies that exist after applying the migrations in order: `create` adds, `drop` removes
 * (by qualified name, so a policy dropped and recreated counts once). Limits, on purpose: `alter table ...
 * rename`, `drop schema ... cascade` and objects created inside dynamic SQL (`execute`) are not followed.
 */
export function countSchemaIn(migrations: string[]): { tables: number; policies: number } {
  const tables = new Set<string>();
  const policies = new Set<string>();
  for (const raw of migrations) {
    const sql = stripComments(raw, '--');
    const re = new RegExp(
      String.raw`^\s*(?:(create\s+(?:unlogged\s+)?table(?:\s+if\s+not\s+exists)?\s+)${NAME}|(create\s+policy\s+)${NAME}\s+on\s+${NAME}|(drop\s+table(?:\s+if\s+exists)?\s+)([^;]+)|(drop\s+policy(?:\s+if\s+exists)?\s+)${NAME}\s+on\s+${NAME})`,
      'gim',
    );
    for (const m of sql.matchAll(re)) {
      if (m[1]) tables.add(normalizeName(m[2] as string));
      else if (m[3]) policies.add(`${normalizeName(m[5] as string)}#${normalizeName(m[4] as string)}`);
      else if (m[6]) {
        for (const t of (m[7] as string).split(',')) {
          const name = t.trim().replace(/\s+(cascade|restrict)\s*$/i, '');
          if (name) tables.delete(normalizeName(name));
        }
      } else if (m[8]) policies.delete(`${normalizeName(m[10] as string)}#${normalizeName(m[9] as string)}`);
    }
  }
  return { tables: tables.size, policies: policies.size };
}

/** The migrations are the only schema source (no baseline.sql since D49); comments are ignored. */
function countSchema(repoRoot: string): { tables: number; policies: number } {
  const dir = join(repoRoot, 'supabase/migrations');
  if (!existsSync(dir)) throw new Error(`schema baseline not found: ${dir} (supabase/migrations)`);
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  return countSchemaIn(files.map((name) => readFileSync(join(dir, name), 'utf8')));
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

  // Cloudflare Workers Builds exposes WORKERS_CI_*; a pull_request run checks out a merge commit, so the head
  // SHA comes from GITHUB_PR_HEAD_SHA (ci.yml / preview.yml) before GITHUB_SHA.
  const rawBranch =
    env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME || env.WORKERS_CI_BRANCH || git(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const branch = rawBranch === 'HEAD' ? 'detached' : rawBranch;
  const sha = env.GITHUB_PR_HEAD_SHA || env.GITHUB_SHA || env.WORKERS_CI_COMMIT_SHA;
  const commit = sha ? sha.slice(0, 7) : git(repoRoot, ['rev-parse', '--short=7', 'HEAD']);
  const reviewedAt = git(repoRoot, ['log', '-1', '--format=%cs']);

  return buildInfoSchema.parse({ branch, commit, nextVersion, gatewayRoutes, supabase, reviewedAt });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const webRoot = fileURLToPath(new URL('..', import.meta.url));
  const info = computeBuildInfo({ repoRoot: join(webRoot, '../..'), env: process.env });
  writeFileSync(join(webRoot, 'content/generated/build-info.json'), `${JSON.stringify(info, null, 2)}\n`);
  console.log(`build-info: ${info.branch}@${info.commit}, next ${info.nextVersion}, ${info.gatewayRoutes} routes, ${info.supabase.tables} tables`);
}
