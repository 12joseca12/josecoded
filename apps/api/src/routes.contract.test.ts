// Characterization of the inherited surface of the gateway: health, system and v1-protected stay mounted, with
// the same auth gate and the same error envelope; forum/* and admin-chat/* were retired with their tables in plan
// 1.8c (DATOS §9, Q1). It runs without Supabase or the backend (unauthenticated requests stop at the gate). New
// routes get their own tests.
import { describe, expect, it } from 'vitest';

import { app } from './index';

const env = {
  API_MODE: 'development',
  WORKER_URL: 'https://example.com',
  WORKER_INTERNAL_TOKEN: 'test-internal-token-12345',
  CORS_ORIGINS: 'http://localhost:3000',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key-12345',
} as const;

type Envelope = { ok: boolean; error?: { code?: string } };

async function call(method: string, path: string, init: RequestInit = {}) {
  return app.request(`http://localhost${path}`, { method, ...init }, env);
}

describe('legacy route surface stays mounted', () => {
  it.each([
    ['GET', '/health'],
    ['GET', '/api/v1/health'],
  ])('%s %s is public and answers ok', async (method, path) => {
    const res = await call(method, path);
    expect(res.status).toBe(200);
    expect(((await res.json()) as Envelope).ok).toBe(true);
  });

  it('GET /health keeps its payload', async () => {
    const res = await call('GET', '/health');
    const json = (await res.json()) as { ok: boolean; data: Record<string, unknown> };
    expect(json.data).toMatchObject({ service: 'josecoded-api', mode: 'development' });
    expect(typeof json.data.timestamp).toBe('string');
  });

  it.each([
    ['GET', '/api/v1/auth/me'],
    ['GET', '/api/v1/system/status'],
  ])('%s %s requires a user (401 unauthorized envelope)', async (method, path) => {
    const res = await call(method, path);
    expect(res.status).toBe(401);
    const json = (await res.json()) as Envelope;
    expect(json).toMatchObject({ ok: false, error: { code: 'unauthorized' } });
  });

  it.each([
    ['GET', '/api/v1/forum/thematics'],
    ['GET', '/api/v1/forum/popular'],
    ['POST', '/api/v1/forum/entries'],
    ['GET', '/api/v1/admin-chat/thread'],
    ['GET', '/api/v1/admin-chat/admin/conversations'],
    ['POST', '/api/v1/admin-chat/n8n/inbound'],
  ])('retired %s %s no longer answers: it stops at the wildcard auth gate like any unknown path', async (method, path) => {
    const res = await call(method, path);
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ ok: false, error: { code: 'unauthorized' } });
  });
});

describe('exact route surface', () => {
  // `app.routes` lists every handler and middleware registered, so removing, renaming or remounting a route
  // changes this snapshot. Updating it is a contract change and needs a reason in the commit.
  it('matches the committed snapshot', () => {
    const surface = [...new Set(app.routes.map((r) => `${r.method} ${r.path}`))].sort();
    expect(surface).toMatchSnapshot();
  });

  it('keeps the routes the clients call in the surface', () => {
    const surface = new Set(app.routes.map((r) => `${r.method} ${r.path}`));
    for (const route of [
      'GET /health',
      'GET /system/status',
      'GET /api/v1/health',
      'GET /api/v1/auth/me',
      'GET /api/v1/system/status',
    ]) {
      expect(surface.has(route)).toBe(true);
    }
  });

  it('has no forum or admin-chat route or middleware left', () => {
    expect(app.routes.filter((r) => /\/(forum|admin-chat)(\/|$)/.test(r.path))).toEqual([]);
  });

  it('the auth gate is a wildcard: unknown paths under /api/v1 also answer 401, so only the surface proves a route exists', async () => {
    const res = await call('GET', '/api/v1/does-not-exist');
    expect(res.status).toBe(401);
    // a malformed Authorization header is rejected by the gate itself, without calling Supabase
    const bad = await call('GET', '/api/v1/auth/me', { headers: { Authorization: 'Basic abc' } });
    expect(bad.status).toBe(401);
    expect(await bad.json()).toMatchObject({
      ok: false,
      error: { code: 'unauthorized', message: 'Invalid authorization header' },
    });
  });
});

describe('error envelope and headers', () => {
  it('unknown routes answer 404 with the not_found envelope', async () => {
    const res = await call('GET', '/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });

  it('a misconfigured env answers 500 internal_error without leaking the cause', async () => {
    const res = await app.request(
      'http://localhost/api/v1/health',
      {},
      { API_MODE: 'production' },
    );
    expect(res.status).toBe(500);
    const json = (await res.json()) as Envelope;
    expect(json.error?.code).toBe('internal_error');
    // the cause (which variables are missing) is not echoed to the client
    expect(json).not.toHaveProperty('error.details');
    expect(JSON.stringify(json)).not.toMatch(/Invalid environment|SUPABASE|WORKER/);
  });

  it('sets a request id and the security headers on every response', async () => {
    const res = await call('GET', '/health');
    expect(res.headers.get('x-request-id')).toBeTruthy();
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('CORS preflight: allows the methods and headers of the contract', async () => {
    const res = await call('OPTIONS', '/api/v1/auth/me', {
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
    });
    expect(res.status).toBeLessThan(300);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    const methods = (res.headers.get('access-control-allow-methods') ?? '').split(',').map((m) => m.trim());
    expect(methods).toEqual(expect.arrayContaining(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']));
    const headers = (res.headers.get('access-control-allow-headers') ?? '')
      .toLowerCase()
      .split(',')
      .map((h) => h.trim());
    expect(headers).toEqual(expect.arrayContaining(['content-type', 'authorization']));
  });

  it('CORS: localhost is only allowed in development when CORS_ORIGINS is empty', async () => {
    const origin = { headers: { Origin: 'http://localhost:3000' } };
    const run = (e: Record<string, string>) =>
      app.request('http://localhost/health', origin, { ...env, CORS_ORIGINS: '', ...e });
    expect((await run({ API_MODE: 'development' })).headers.get('access-control-allow-origin')).toBe(
      'http://localhost:3000',
    );
    expect((await run({ API_MODE: 'production' })).headers.get('access-control-allow-origin') ?? '').toBe('');
  });

  it('CORS: the production list admits preview Workers (dash wildcard) and nothing like them', async () => {
    const list =
      'https://josecoded.com,https://www.josecoded.com,https://*-josecoded-web.jose.workers.dev,http://localhost:3000';
    const allowOrigin = async (origin: string) =>
      (
        await app.request(
          'http://localhost/api/v1/health',
          { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' } },
          { ...env, API_MODE: 'production', CORS_ORIGINS: list },
        )
      ).headers.get('access-control-allow-origin') ?? '';

    expect(await allowOrigin('https://abc123-josecoded-web.jose.workers.dev')).toBe(
      'https://abc123-josecoded-web.jose.workers.dev',
    );
    expect(await allowOrigin('https://josecoded.com')).toBe('https://josecoded.com');
    expect(await allowOrigin('https://josecoded-web.jose.workers.dev')).toBe('');
    expect(await allowOrigin('https://abc-josecoded-web.jose.workers.dev.evil.com')).toBe('');
    expect(await allowOrigin('https://x.jose.workers.dev')).toBe('');
  });

  it('CORS: allows a configured origin and nothing else', async () => {
    const allowed = await call('GET', '/health', { headers: { Origin: 'http://localhost:3000' } });
    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    const other = await call('GET', '/health', { headers: { Origin: 'https://evil.example' } });
    expect(other.headers.get('access-control-allow-origin') ?? '').toBe('');
  });
});
