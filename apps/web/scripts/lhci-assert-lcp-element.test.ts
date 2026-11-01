import { describe, expect, it } from 'vitest';

import { assertReports, isAllowedLcpElement, lcpNode } from './lhci-assert-lcp-element.ts';

const report = (node: { selector: string; snippet: string }) => ({
  file: 'mobile/lhr-1.json',
  lhr: { finalUrl: 'http://x/', audits: { 'largest-contentful-paint-element': { details: { items: [{ items: [{ node }] }] } } } },
});

describe('isAllowedLcpElement', () => {
  it('accepts the hero h1 and any element inside it', () => {
    expect(isAllowedLcpElement({ selector: 'body > main > section#top > div.copy > h1.title', snippet: '<h1 class="title">' })).toBe(true);
    expect(isAllowedLcpElement({ selector: 'section > div > h1.title > span.ch', snippet: '<span>' })).toBe(true);
  });
  it('accepts the poster image', () => {
    expect(isAllowedLcpElement({ selector: 'picture > img.posterImage', snippet: '<img class="x" src="/hero/poster.webp?v=1">' })).toBe(true);
  });
  it('rejects other elements and a missing node', () => {
    expect(isAllowedLcpElement({ selector: 'div.cell > p.lead', snippet: '<p class="lead">' })).toBe(false);
    expect(isAllowedLcpElement({ selector: 'canvas', snippet: '<canvas>' })).toBe(false);
    expect(isAllowedLcpElement({ selector: 'div > h10', snippet: '<h10>' })).toBe(false);
    expect(isAllowedLcpElement(undefined)).toBe(false);
  });
});

describe('assertReports', () => {
  it('passes for allowed elements, fails with the offender otherwise', () => {
    const ok = report({ selector: 'section > h1.title', snippet: '<h1>' });
    const bad = report({ selector: 'div.cell > p', snippet: '<p>' });
    expect(assertReports([ok])).toEqual([]);
    expect(assertReports([ok, bad])).toHaveLength(1);
    expect(lcpNode(bad.lhr)?.selector).toBe('div.cell > p');
  });
  it('fails without reports', () => {
    expect(assertReports([])[0]).toMatch(/no Lighthouse reports/);
  });
});
