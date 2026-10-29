import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { computeBuildInfo, countRoutesIn, countSchemaIn, stripComments } from './build-info';

const repoRoot = join(process.cwd(), '../..');

describe('computeBuildInfo', () => {
  it('computes all mandatory fields from repo sources', () => {
    const info = computeBuildInfo({
      repoRoot,
      env: { GITHUB_REF_NAME: 'feat/x', GITHUB_SHA: 'abcdef1234567' },
    });
    expect(info.branch).toBe('feat/x');
    expect(info.commit).toBe('abcdef1');
    expect(info.nextVersion).toMatch(/^16\./);
    expect(info.gatewayRoutes).toBeGreaterThanOrEqual(6);
    expect(info.supabase.tables).toBeGreaterThanOrEqual(26);
    expect(info.supabase.policies).toBeGreaterThan(0);
    expect(info.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('prefers the PR head branch over the merge ref', () => {
    const info = computeBuildInfo({
      repoRoot,
      env: { GITHUB_HEAD_REF: 'feat/real', GITHUB_REF_NAME: '12/merge', GITHUB_SHA: 'abcdef1234567' },
    });
    expect(info.branch).toBe('feat/real');
  });

  it('throws when a source is missing', () => {
    expect(() => computeBuildInfo({ repoRoot: '/nonexistent', env: {} })).toThrow(/routes-manifest|baseline/);
  });

  it('throws when the migrations are missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'build-info-'));
    mkdirSync(join(root, 'apps/api/src'), { recursive: true });
    writeFileSync(
      join(root, 'apps/api/src/routes-manifest.ts'),
      "export const routes = [{ method: 'GET', path: '/health' }] as const;\n",
    );
    expect(() => computeBuildInfo({ repoRoot: root, env: {} })).toThrow(/baseline/);
  });

  it('prefers the PR head SHA over the merge commit SHA', () => {
    const info = computeBuildInfo({
      repoRoot,
      env: { GITHUB_PR_HEAD_SHA: '1234567890abc', GITHUB_SHA: 'abcdef1234567', GITHUB_REF_NAME: 'x' },
    });
    expect(info.commit).toBe('1234567');
  });

  it('reads Cloudflare Workers Builds variables', () => {
    const info = computeBuildInfo({ repoRoot, env: { WORKERS_CI_BRANCH: 'feat/cf', WORKERS_CI_COMMIT_SHA: 'fedcba9876543' } });
    expect(info).toMatchObject({ branch: 'feat/cf', commit: 'fedcba9' });
  });

  it('falls back to git rev-parse when no CI variable is set', () => {
    const info = computeBuildInfo({ repoRoot, env: {} });
    expect(info.branch).not.toBe('HEAD');
    expect(info.commit).toBe(execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim());
  });

  it('maps a detached HEAD to "detached"', () => {
    const root = mkdtempSync(join(tmpdir(), 'build-info-git-'));
    for (const [path, text] of Object.entries({
      'apps/api/src/routes-manifest.ts': "export const routes = [{ method: 'GET', path: '/health' }] as const;\n",
      'supabase/migrations/1.sql': 'create table public.a (id int);\n',
      'pnpm-lock.yaml': "importers:\n  apps/web:\n    dependencies:\n      next:\n        specifier: 16.3.6\n        version: 16.3.6(react@19)\n",
    })) {
      mkdirSync(join(root, path, '..'), { recursive: true });
      writeFileSync(join(root, path), text);
    }
    const git = (...args: string[]) =>
      execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], { cwd: root, stdio: 'ignore' });
    git('init', '-q');
    git('add', '.');
    git('commit', '-q', '-m', 'x');
    git('checkout', '-q', '--detach');
    expect(computeBuildInfo({ repoRoot: root, env: {} }).branch).toBe('detached');
  });
});

describe('countRoutesIn', () => {
  it('does not depend on field order, comments or braces inside paths', () => {
    const src = `export const routes = [
      // { method: 'GET', path: '/commented' },
      { path: '/a/{id}', module: 'x', method: 'GET' },
      { method: 'POST', path: '/b', module: 'x' },
    ] as const satisfies readonly RouteEntry[];`;
    expect(countRoutesIn(src)).toBe(2);
  });

  it('fails loudly on an entry it cannot read or a missing array', () => {
    expect(() => countRoutesIn("export const routes = [{ verb: 'GET', path: '/a' }] as const;")).toThrow(/without method and path/);
    expect(() => countRoutesIn('export const other = 1;')).toThrow(/not found/);
    expect(() => countRoutesIn('export const routes = [] as const;')).toThrow(/no routes/);
  });
});

describe('countSchemaIn', () => {
  it('counts net of drops and recreated policies', () => {
    const counts = countSchemaIn([
      `create table public.a (id int);
       create table if not exists b (id int);
       create table private.c (id int);
       create policy "p one" on public.a for select using (true);
       create policy p2 on public.b for select using (true);`,
      `drop table if exists public.c, private.c;
       drop policy if exists p2 on public.b;
       create policy p2 on public.b for select using (false);
       drop table b cascade;`,
    ]);
    expect(counts).toEqual({ tables: 1, policies: 2 });
  });

  it('ignores line and block comments but keeps "--" inside string literals', () => {
    const counts = countSchemaIn([
      `-- create table public.no (id int);
       /* create table public.no2 (id int);
          /* nested */ create table public.no3 (id int); */
       create table public.a (note text default '-- not a comment');
       create table public.b (id int); -- trailing`,
    ]);
    expect(counts.tables).toBe(2);
  });
});

describe('stripComments', () => {
  it('keeps quoted text intact', () => {
    expect(stripComments("a '--x' /* c */ b -- d\nc", '--')).toBe("a '--x'   b \nc");
  });
});
