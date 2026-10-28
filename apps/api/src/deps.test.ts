import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { buildDeps, resolveDeps, type AppEnv } from './deps';
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

  it('always builds the Supabase gateway; outbox, notices and scheduled jobs only with the secret key', () => {
    const plain = buildDeps(env);
    expect(plain.supabase).toBeDefined();
    expect(plain).not.toHaveProperty('outbox');
    expect(plain).not.toHaveProperty('notices');
    expect(plain).not.toHaveProperty('scheduledJobs');

    const withSecret = buildDeps({ ...env, SUPABASE_SECRET_KEY: 'sb_secret_test_0123456789abcdef' });
    expect(withSecret.outbox).toBeDefined();
    expect(withSecret.notices).toBeDefined();
    expect(withSecret.scheduledJobs).toBeDefined();
  });

  it('builds Telegram only with the bot token and the admin chat id', () => {
    expect(buildDeps(env)).not.toHaveProperty('telegram');
    expect(buildDeps({ ...env, TELEGRAM_BOT_TOKEN: '123456:test-token' })).not.toHaveProperty('telegram');
    expect(buildDeps({ ...env, TELEGRAM_BOT_TOKEN: '123456:test-token', TELEGRAM_ADMIN_CHAT_ID: '42' }).telegram).toBeDefined();
  });

  it('opens no connection while building (the service client is created on first use)', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    buildDeps({ ...env, SUPABASE_SECRET_KEY: 'sb_secret_test_0123456789abcdef', TELEGRAM_BOT_TOKEN: '1:t', TELEGRAM_ADMIN_CHAT_ID: '1' });
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('resolveDeps', () => {
  it('validates the env first: an invalid one throws Invalid environment', () => {
    expect(() => resolveDeps({ ...env, API_MODE: 'production', WORKER_URL: 'not a url' })).toThrow(/^Invalid environment:/);
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
