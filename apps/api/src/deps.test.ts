import { Hono } from 'hono';

import { buildDeps, type AppEnv } from './deps';
import { withDeps } from './middlewares/with-deps';

import type { Env } from './types/env.types';

const env = {
  API_MODE: 'development',
  WORKER_URL: 'http://worker.test',
  WORKER_INTERNAL_TOKEN: 'test-internal-token-12345',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'http://127.0.0.1:54321',
} satisfies Env;

describe('buildDeps', () => {
  it('builds the real clock', () => {
    const before = Date.now();
    const now = buildDeps(env).clock.now().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });

  it('returns a fresh object per call (built once per request, never shared)', () => {
    expect(buildDeps(env)).not.toBe(buildDeps(env));
  });
});

describe('withDeps', () => {
  it('leaves the deps in c.var.deps for the handlers after it', async () => {
    const app = new Hono<AppEnv>();
    app.use('*', withDeps);
    app.get('/now', (c) => c.json({ iso: c.var.deps.clock.now().toISOString() }));

    const res = await app.request('/now', {}, env);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { iso: string };
    expect(Number.isNaN(Date.parse(body.iso))).toBe(false);
  });
});
