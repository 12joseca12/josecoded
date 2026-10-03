// Characterization of the legacy surface of the gateway: every route that existed in josedev/josecoded-api
// must stay mounted, with the same auth gate and the same error envelope. It runs without Supabase or the
// backend (unauthenticated requests stop at the gate). New routes are additive and get their own tests.
import app from './index';

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
    ['GET', '/api/v1/admin-chat/thread'],
    ['POST', '/api/v1/admin-chat/messages'],
    ['POST', '/api/v1/admin-chat/meeting'],
    ['GET', '/api/v1/admin-chat/admin/conversations'],
    ['GET', '/api/v1/admin-chat/admin/conversations/abc/messages'],
    ['POST', '/api/v1/admin-chat/admin/conversations/abc/messages'],
    ['POST', '/api/v1/admin-chat/admin/conversations/abc/ai'],
    ['POST', '/api/v1/admin-chat/admin/conversations/abc/read'],
  ])('%s %s requires a user (401 unauthorized envelope)', async (method, path) => {
    const res = await call(method, path);
    expect(res.status).toBe(401);
    const json = (await res.json()) as Envelope;
    expect(json).toMatchObject({ ok: false, error: { code: 'unauthorized' } });
  });

  it.each([
    ['GET', '/api/v1/forum/thematics'],
    ['GET', '/api/v1/forum/popular'],
  ])('%s %s is public and answers ok', async (method, path) => {
    const res = await call(method, path);
    expect(res.status).toBe(200);
    expect(((await res.json()) as Envelope).ok).toBe(true);
  });

  it('keeps the write routes of the forum mounted (they never fall to the 404 handler)', async () => {
    const routes = [
      ['POST', '/api/v1/forum/entries'],
      ['POST', '/api/v1/forum/entries/a/b/comments'],
      ['PUT', '/api/v1/forum/entries/a/b/comments/1'],
      ['DELETE', '/api/v1/forum/entries/a/b/comments/1'],
    ] as const;
    const codes: string[] = [];
    for (const [method, path] of routes) {
      const res = await call(method, path);
      const json = (await res.json()) as Envelope;
      codes.push(`${method} ${path} -> ${json.error?.code ?? 'ok'}`);
    }
    expect(codes.filter((c) => c.endsWith('not_found'))).toEqual([]);
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
      'http://localhost/api/v1/forum/thematics',
      {},
      { API_MODE: 'production' },
    );
    expect(res.status).toBe(500);
    const json = (await res.json()) as Envelope;
    expect(json.error?.code).toBe('internal_error');
  });

  it('sets a request id and the security headers on every response', async () => {
    const res = await call('GET', '/health');
    expect(res.headers.get('x-request-id')).toBeTruthy();
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('CORS: allows a configured origin and nothing else', async () => {
    const allowed = await call('GET', '/health', { headers: { Origin: 'http://localhost:3000' } });
    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    const other = await call('GET', '/health', { headers: { Origin: 'https://evil.example' } });
    expect(other.headers.get('access-control-allow-origin') ?? '').toBe('');
  });
});
