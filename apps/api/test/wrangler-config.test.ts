import { describe, expect, it } from 'vitest';

// Vite inlines the file as text: the tests run in workerd, which has no filesystem.
import raw from '../wrangler.jsonc?raw';

type RateLimit = { name: string; namespace_id: string; simple?: { limit: number; period: number } };
type WranglerSection = {
  name?: string;
  vars?: Record<string, unknown>;
  define?: Record<string, string>;
  triggers?: { crons?: string[] };
  ratelimits?: RateLimit[];
  routes?: unknown;
  workers_dev?: boolean;
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

  it.each(sections)('%s: vars carry nothing of the retired modules nor a personal email (plan 1.8c)', (_name, section) => {
    const keys = Object.keys(section.vars ?? {});
    expect(keys.filter((k) => /^(FORUM_|ADMIN_SUPERUSER_|N8N_CHAT_|NOTIFY_SHARED_SECRET)/.test(k))).toEqual([]);
    expect(JSON.stringify(section.vars ?? {})).not.toMatch(/@[a-z0-9-]+\.[a-z]/i);
  });

  it.each(sections)('%s: __TEST_HOOKS__ is compiled to false (define is not inherited)', (_name, section) => {
    expect(section.define?.__TEST_HOOKS__).toBe('false');
  });
});

describe('wrangler.jsonc: API_MODE', () => {
  it('the top level (production Worker) runs in production mode: no error.message leak, no /api/dev/*', () => {
    expect(config.vars?.API_MODE).toBe('production');
  });
});

describe('wrangler.jsonc: Omen is optional (task 1.8d)', () => {
  it('declares no WORKER_URL / WORKER_INTERNAL_TOKEN var in any environment', () => {
    for (const [, section] of sections) {
      expect(Object.keys(section.vars ?? {}).filter((k) => k.startsWith('WORKER_'))).toEqual([]);
    }
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
    // `routes` and `workers_dev` are inheritable: both are declared so the production route
    // (api.josecoded.com) and a top-level `workers_dev: false` can never leak into the preview
    expect(preview?.routes).toEqual([]);
    expect(preview?.workers_dev).toBe(true);
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

  it('declares the assistant limiter, 10 per minute per visitor (task 4.4)', () => {
    const limiter = (config.ratelimits ?? []).find((r) => r.name === 'ASSISTANT_RATE_LIMITER');
    expect(limiter).toMatchObject({ namespace_id: '1005', simple: { limit: 10, period: 60 } });
  });

  it('declares the assistant polling-read limiter, 30 per minute per visitor (B03.y)', () => {
    const limiter = (config.ratelimits ?? []).find((r) => r.name === 'ASSISTANT_READ_RATE_LIMITER');
    expect(limiter).toMatchObject({ namespace_id: '1006', simple: { limit: 30, period: 60 } });
  });

  it('routes every Workers AI call through an AI Gateway in every environment', () => {
    for (const [, section] of sections.filter(([name]) => name === 'top level' || name === 'env.preview')) {
      expect(String(section.vars?.AI_GATEWAY_ID ?? '')).not.toBe('');
    }
  });

  it('the CORS list admits the preview wildcard with a dash, never a dot', () => {
    const list = String(config.env?.preview?.vars?.CORS_ORIGINS);
    expect(list).toContain('https://*-josecoded-web.jose.workers.dev');
    expect(list).not.toContain('https://*.');
  });
});

describe('wrangler.jsonc: production origins (security review B1)', () => {
  const list = (value: unknown) => String(value ?? '').split(',').map((v) => v.trim()).filter(Boolean);

  it('the production Worker allows only the two site origins and hostnames', () => {
    expect(list(config.vars?.CORS_ORIGINS)).toEqual(['https://josecoded.com', 'https://www.josecoded.com']);
    expect(list(config.vars?.ALLOWED_TURNSTILE_HOSTNAMES)).toEqual(['josecoded.com', 'www.josecoded.com']);
  });

  it('no localhost, loopback, wildcard or workers.dev entry reaches production', () => {
    const production = JSON.stringify([config.vars?.CORS_ORIGINS, config.vars?.ALLOWED_TURNSTILE_HOSTNAMES]);
    expect(production).not.toMatch(/localhost|127\.0\.0\.1|\*|workers\.dev|http:\/\//);
  });

  it('previews and local dev keep theirs in env.preview', () => {
    const preview = config.env?.preview?.vars;
    expect(list(preview?.CORS_ORIGINS)).toEqual(expect.arrayContaining(['https://*-josecoded-web.jose.workers.dev', 'http://localhost:3000']));
    expect(list(preview?.ALLOWED_TURNSTILE_HOSTNAMES)).toEqual(expect.arrayContaining(['*-josecoded-web.jose.workers.dev', 'localhost']));
  });
});

