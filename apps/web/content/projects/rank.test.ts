import { describe, expect, it } from 'vitest';

import { projects } from './index';
import { proofCount, rankProjects } from './rank';

const sheet = (slug: string, proofs: Record<string, string>, extra: Record<string, unknown> = {}) => ({
  slug,
  proofs,
  year: 2026,
  ...extra,
});

describe('rankProjects', () => {
  it('orders by number of verifiable proofs, then recency; a reduced sheet is never first', () => {
    const ranked = rankProjects([
      sheet('reduced', { appStoreId: '1', playPackage: 'x' }, { hideMetrics: true, year: 2024 }),
      sheet('one', { repoUrl: 'https://github.com/a/b' }),
      sheet('two', { webUrl: 'https://w.example', repoUrl: 'https://github.com/a/c' }),
    ]);
    expect(ranked.map((project) => project.slug)).toEqual(['two', 'reduced', 'one']);
  });

  it('never puts this site first, even with the most direct proof', () => {
    const ranked = rankProjects([
      sheet('site', { webUrl: 'https://josecoded.com' }, { self: true }),
      sheet('app', {}),
    ]);
    expect(ranked.map((project) => project.slug)).toEqual(['app', 'site']);
  });

  it('does not count a pending link as a proof', () => {
    expect(proofCount({ proofs: { appStoreId: '{{DATO: id}}', webUrl: 'https://x.example' } })).toBe(1);
  });

  it('ranks the real sheets with a project for a third party first', () => {
    const ranked = rankProjects(projects);
    expect(ranked[0]?.slug).not.toBe('josecoded');
    expect(ranked[0]?.hideMetrics).toBe(false);
    expect(ranked).toHaveLength(projects.length);
  });
});
