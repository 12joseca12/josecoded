// GET /api/v1/system/status (authenticated) is the only route that calls Omen. Without Omen configured it answers
// 503 worker_not_configured and never reaches the network (task 1.8d).
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFakeSupabaseGateway } from './fakes/supabase.fake';
import { app } from '../src/index';

const base = {
  API_MODE: 'production',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key',
};
const supabase = createFakeSupabaseGateway({ t: { id: 'u', email: 'u@test', aal: 'aal1' } });
const hooks = { TEST: '1', __deps: { supabase } };

const status = (bindings: Record<string, unknown>) =>
  app.request('http://localhost/api/v1/system/status', { headers: { Authorization: 'Bearer t' } }, { ...base, ...hooks, ...bindings });

afterEach(() => vi.unstubAllGlobals());

describe('GET /api/v1/system/status', () => {
  it('answers 503 worker_not_configured without Omen and makes no outbound call', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await status({});
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, error: { code: 'worker_not_configured' } });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('proxies Omen when it is configured', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, data: { up: true } })));
    const res = await status({ WORKER_URL: 'https://worker.test', WORKER_INTERNAL_TOKEN: 'test-internal-token-12345' });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it('answers 502 upstream_error when Omen is configured but down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'down' }, { status: 500 })));
    const res = await status({ WORKER_URL: 'https://worker.test', WORKER_INTERNAL_TOKEN: 'test-internal-token-12345' });
    expect(res.status).toBe(502);
  });
});
