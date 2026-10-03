import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import app from '../src/index';
import { createFakeClock } from './fakes/clock.fake';
import { withDeps } from '../src/middlewares/with-deps';

import type { AppEnv } from '../src/deps';
import type { Env } from '../src/types/env.types';

const env = {
  API_MODE: 'development',
  WORKER_URL: 'http://worker.test',
  WORKER_INTERNAL_TOKEN: 'test-internal-token-12345',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'http://127.0.0.1:54321',
} satisfies Env;

// A health-shaped route of a NEW module: it takes the time from deps, like every new service will.
// (The legacy /health reads Date directly and must stay as it is.)
const healthLike = new Hono<AppEnv>();
healthLike.use('*', withDeps);
healthLike.get('/health', (c) => c.json({ timestamp: c.var.deps.clock.now().toISOString() }));

async function timestamp(bindings: Record<string, unknown>) {
  const res = await healthLike.request('/health', {}, { ...env, ...bindings });
  return ((await res.json()) as { timestamp: string }).timestamp;
}

describe('env.__deps override (working-agreements 17.1)', () => {
  it('replaces the clock with the fake when TEST is "1"', async () => {
    const clock = createFakeClock('2026-05-04T10:00:00.000Z');
    expect(await timestamp({ TEST: '1', __deps: { clock } })).toBe('2026-05-04T10:00:00.000Z');

    clock.advance(90_000);
    expect(await timestamp({ TEST: '1', __deps: { clock } })).toBe('2026-05-04T10:01:30.000Z');
  });

  it('ignores __deps unless TEST is exactly "1"', async () => {
    const clock = createFakeClock('2001-01-01T00:00:00.000Z');
    for (const bindings of [{ __deps: { clock } }, { TEST: '0', __deps: { clock } }, { TEST: 'true', __deps: { clock } }]) {
      const value = await timestamp(bindings);
      expect(value).not.toBe('2001-01-01T00:00:00.000Z');
      expect(Math.abs(Date.now() - Date.parse(value))).toBeLessThan(5_000);
    }
  });

  it('does not change the legacy gateway: the real app answers /health with or without the hook', async () => {
    const clock = createFakeClock('2001-01-01T00:00:00.000Z');
    const plain = await app.request('http://localhost/health', {}, env);
    const hooked = await app.request('http://localhost/health', {}, { ...env, TEST: '1', __deps: { clock } });
    expect(hooked.status).toBe(plain.status);
    const body = (await hooked.json()) as { data: { service: string; timestamp: string } };
    expect(body.data.service).toBe('josecoded-api');
    expect(body.data.timestamp).not.toBe('2001-01-01T00:00:00.000Z');
  });
});

describe('fake clock', () => {
  it('stays frozen until advanced or set', () => {
    const clock = createFakeClock('2026-01-01T00:00:00.000Z');
    expect(clock.now().getTime()).toBe(clock.now().getTime());
    clock.advance(1000);
    expect(clock.now().toISOString()).toBe('2026-01-01T00:00:01.000Z');
    clock.set('2030-02-03T04:05:06.000Z');
    expect(clock.now().toISOString()).toBe('2030-02-03T04:05:06.000Z');
  });
});
