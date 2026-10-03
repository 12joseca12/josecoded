import { describe, expect, it } from 'vitest';

// Vite inlines the file as text: the tests run in workerd, which has no filesystem.
import raw from '../wrangler.jsonc?raw';

type RateLimit = { name: string; namespace_id: string };
type WranglerSection = {
  name?: string;
  vars?: Record<string, unknown>;
  define?: Record<string, string>;
  triggers?: { crons?: string[] };
  ratelimits?: RateLimit[];
  routes?: unknown;
};
type Wrangler = WranglerSection & { env?: Record<string, WranglerSection> };

/**
 * Minimal JSONC reader: drops full-line `//` comments, the only kind wrangler.jsonc uses. Block comments are
 * not handled on purpose: values such as "https://*-host" and "*\/5 * * * *" contain the characters `/*`.
 */
function parseJsonc(text: string): Wrangler {
  const withoutComments = text
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return JSON.parse(withoutComments) as Wrangler;
}

const config = parseJsonc(raw);
const sections: [string, WranglerSection][] = [
  ['top level', config],
  ...Object.entries(config.env ?? {}).map(([name, s]): [string, WranglerSection] => [`env.${name}`, s]),
];

describe('wrangler.jsonc keeps the test hooks out of deployed Workers', () => {
  it.each(sections)('%s: vars never contain TEST or __deps', (_name, section) => {
    const keys = Object.keys(section.vars ?? {});
    expect(keys).not.toContain('TEST');
    expect(keys).not.toContain('__deps');
  });

  it.each(sections)('%s: __TEST_HOOKS__ is compiled to false (define is not inherited)', (_name, section) => {
    expect(section.define?.__TEST_HOOKS__).toBe('false');
  });
});

describe('wrangler.jsonc: cron and preview Worker', () => {
  const preview = config.env?.preview;

  it('has a single Cron Trigger, every 5 minutes (Workers Free: 5 per account)', () => {
    expect(config.triggers?.crons).toEqual(['*/5 * * * *']);
  });

  it('declares the preview as its own Worker, without cron or routes', () => {
    expect(preview?.name).toBe('josecoded-api-preview');
    expect(preview?.triggers?.crons).toEqual([]);
    expect(preview).not.toHaveProperty('routes');
  });

  it('gives the preview its own rate limiters (distinct namespaces, same names and limits)', () => {
    const prod = config.ratelimits ?? [];
    const own = preview?.ratelimits ?? [];
    expect(own.map((r) => r.name)).toEqual(prod.map((r) => r.name));
    const namespaces = [...prod, ...own].map((r) => r.namespace_id);
    expect(new Set(namespaces).size).toBe(namespaces.length);
  });

  it('declares the three new rate limiters of DT 3.6', () => {
    const byName = Object.fromEntries((config.ratelimits ?? []).map((r) => [r.name, r.namespace_id]));
    expect(byName).toMatchObject({
      LEADS_RATE_LIMITER: '1002',
      AFFILIATE_RATE_LIMITER: '1003',
      RADAR_RATE_LIMITER: '1004',
    });
  });

  it('the CORS list admits the preview wildcard with a dash, never a dot', () => {
    const list = String(config.vars?.CORS_ORIGINS);
    expect(list).toContain('https://*-josecoded-web.jose.workers.dev');
    expect(list).not.toContain('https://*.');
  });
});
