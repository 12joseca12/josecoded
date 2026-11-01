import { describe, expect, it } from 'vitest';

import { analyzeBundle, initialScripts } from './check-hero-bundle.ts';

import type { BundleInput } from './check-hero-bundle.ts';

const page = (...srcs: string[]) =>
  `<html><head><link rel="preload" as="script" fetchPriority="low" href="${srcs[0]}"/></head><body>${srcs
    .map((src) => `<script src="${src}" async=""></script>`)
    .join('')}</body></html>`;

const noise = (n: number) => Array.from({ length: n }, (_, i) => `v${i}=${Math.random()}`).join(';');

function fixture(over: Partial<Record<string, string>> = {}): BundleInput {
  return {
    pages: { '/': page('/_next/static/chunks/a.js', '/_next/static/chunks/b.js') },
    chunks: {
      '/_next/static/chunks/a.js': 'function app(){return 1}',
      '/_next/static/chunks/b.js': 'function react(){return 2}',
      '/_next/static/chunks/scene.js': 'class WebGLRenderer{}' + noise(50),
      ...over,
    },
  };
}

describe('initialScripts', () => {
  it('lists script src and script preloads once, ignoring other links', () => {
    const html =
      '<link rel="preload" href="/f.woff2" as="font"/><link rel="preload" as="script" href="/a.js"/><script src="/a.js"></script><script src="/b.js?v=1"></script><script>inline()</script>';
    expect(initialScripts(html)).toEqual(['/a.js', '/b.js?v=1']);
  });
});

describe('analyzeBundle', () => {
  it('passes and reports sizes when three only lives in a dynamic chunk', () => {
    const report = analyzeBundle(fixture());
    expect(report.errors).toEqual([]);
    expect(report.sceneChunks).toEqual(['/_next/static/chunks/scene.js']);
    expect(report.sceneGz).toBeGreaterThan(0);
    expect(report.homeGz).toBeGreaterThan(0);
  });

  it('fails when an initial chunk contains WebGLRenderer', () => {
    const report = analyzeBundle(fixture({ '/_next/static/chunks/a.js': 'new WebGLRenderer()' }));
    expect(report.errors.join('\n')).toMatch(/initial chunk .*a\.js contains three/);
  });

  it('fails when an initial chunk contains supabase-js', () => {
    const report = analyzeBundle(fixture({ '/_next/static/chunks/b.js': 'class GoTrueClient{}' }));
    expect(report.errors.join('\n')).toMatch(/b\.js contains @supabase\/supabase-js/);
  });

  it('fails when no dynamic chunk holds the scene (the check would be meaningless)', () => {
    const report = analyzeBundle(fixture({ '/_next/static/chunks/scene.js': 'nothing' }));
    expect(report.errors.join('\n')).toMatch(/no dynamic chunk holds three/);
  });

  it('fails when the scene or the home go over budget', () => {
    const big = noise(60_000);
    const scene = analyzeBundle(fixture({ '/_next/static/chunks/scene.js': 'WebGLRenderer' + big.repeat(6) }));
    expect(scene.errors.join('\n')).toMatch(/sceneGz .* over the budget/);
    const home = analyzeBundle(fixture({ '/_next/static/chunks/a.js': big.repeat(8) }));
    expect(home.errors.join('\n')).toMatch(/homeGz .* over the budget/);
  });

  it('fails when the HTML points at a script that is not in the build', () => {
    const input = fixture();
    input.pages['/'] = page('/_next/static/chunks/missing.js');
    expect(analyzeBundle(input).errors.join('\n')).toMatch(/missing\.js is not in the build output/);
  });
});
