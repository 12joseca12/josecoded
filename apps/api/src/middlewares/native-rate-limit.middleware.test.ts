import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { nativeRateLimit, type RateLimiterBinding } from './native-rate-limit.middleware';

import type { Env } from '../types/env.types';

function appWith(limiter: RateLimiterBinding | undefined) {
  const app = new Hono<{ Bindings: Env }>();
  app.use('/ai/*', nativeRateLimit(() => limiter, { keyPrefix: 'ai' }));
  app.get('/ai/ping', (c) => c.text('ok'));
  return app;
}

describe('nativeRateLimit', () => {
  it('deja pasar cuando el binding permite', async () => {
    const res = await appWith({ limit: async () => ({ success: true }) })
      .request('http://x/ai/ping', { headers: { 'cf-connecting-ip': '1.1.1.1' } });
    expect(res.status).toBe(200);
  });

  it('responde 429 cuando el binding niega', async () => {
    const res = await appWith({ limit: async () => ({ success: false }) })
      .request('http://x/ai/ping', { headers: { 'cf-connecting-ip': '1.1.1.1' } });
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
  });

  it('fail-open si no hay binding (dev local)', async () => {
    const res = await appWith(undefined)
      .request('http://x/ai/ping', { headers: { 'cf-connecting-ip': '1.1.1.1' } });
    expect(res.status).toBe(200);
  });

  it('responde 503 fail-closed cuando el binding lanza error', async () => {
    const res = await appWith({ limit: async () => { throw new Error('binding unavailable'); } })
      .request('http://x/ai/ping', { headers: { 'cf-connecting-ip': '1.1.1.1' } });
    expect(res.status).toBe(503);
    expect(res.headers.get('retry-after')).toBeTruthy();
    const body = await res.json();
    expect(body).toMatchObject({ ok: false, error: { code: 'rate_limited', message: 'Too many requests' } });
  });
});

describe('nativeRateLimit: key per client (security review M2)', () => {
  const keys: string[] = [];
  const spy: RateLimiterBinding = { limit: async ({ key }) => (keys.push(key), { success: true }) };

  it('an IPv4 is the key as is; every address of an IPv6 /64 shares one key', async () => {
    keys.length = 0;
    const app = appWith(spy);
    for (const ip of ['1.2.3.4', '2001:db8:1:2::1', '2001:db8:1:2:ffff:ffff:ffff:ffff', '2001:0DB8:0001:0002:abcd::5', '2001:db8:1:3::1']) {
      await app.request('http://x/ai/ping', { headers: { 'cf-connecting-ip': ip } });
    }
    expect(keys).toEqual(['ai:1.2.3.4', 'ai:2001:db8:1:2::/64', 'ai:2001:db8:1:2::/64', 'ai:2001:db8:1:2::/64', 'ai:2001:db8:1:3::/64']);
  });
});
