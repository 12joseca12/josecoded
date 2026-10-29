import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { computeBuildInfo } from './build-info';

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
});
