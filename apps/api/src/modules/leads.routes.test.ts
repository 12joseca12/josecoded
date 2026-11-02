import { describe, expect, it, vi } from 'vitest';

import { app } from '../index';

const env = (limit: ReturnType<typeof vi.fn>) => ({
  API_MODE: 'development',
  CORS_ORIGINS: 'http://localhost:3000',
  SERVER_KEY: 'server-key-for-tests-123456',
  LEADS_RATE_LIMITER: { limit },
});

const post = (headers: Record<string, string>, e: object) =>
  app.request('http://localhost/api/v1/leads', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: '{}' }, e);

describe('POST /api/v1/leads visitor IP', () => {
  it('rate limits by the forwarded IP when the server key is valid', async () => {
    const limit = vi.fn(async () => ({ success: false }));
    const res = await post(
      { 'x-josecoded-server-key': 'server-key-for-tests-123456', 'x-josecoded-client-ip': '203.0.113.7', 'cf-connecting-ip': '198.51.100.1' },
      env(limit),
    );
    expect(res.status).toBe(429);
    expect(limit).toHaveBeenCalledWith({ key: 'leads:203.0.113.7' });
  });

  it('ignores the header on a request that did not prove the server key', async () => {
    const limit = vi.fn(async () => ({ success: false }));
    const res = await post({ 'x-josecoded-client-ip': '203.0.113.7', 'cf-connecting-ip': '198.51.100.1' }, env(limit));
    expect(res.status).toBe(429);
    expect(limit).toHaveBeenCalledWith({ key: 'leads:198.51.100.1' });
  });

  it('refuses a wrong server key before looking at the header', async () => {
    const limit = vi.fn(async () => ({ success: true }));
    const res = await post({ 'x-josecoded-server-key': 'nope', 'x-josecoded-client-ip': '203.0.113.7' }, env(limit));
    expect(res.status).toBe(403);
    expect(limit).not.toHaveBeenCalled();
  });
});
