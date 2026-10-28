// GET /api/v1/auth/me after plan 1.8c: `{ id, email, is_admin }` through c.var.deps. Once with the fake gateway
// (env.__deps) and once with the real adapters against an in-memory Supabase, the offline stand-in for step 3 of
// the plan (`curl /api/v1/auth/me` with the JWT of jose@test against Supabase local -> is_admin: true).
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFakeSupabase, fakeJwt } from './fakes/supabase-rest.fake';
import { createFakeSupabaseGateway } from './fakes/supabase.fake';
import { app } from '../src/index';

import type { Env } from '../src/types/env.types';

const env = {
  API_MODE: 'development',
  WORKER_URL: 'http://worker.test',
  WORKER_INTERNAL_TOKEN: 'test-internal-token-12345',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key',
} satisfies Env;

const me = (token: string, bindings: Record<string, unknown>) =>
  app.request('http://localhost/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } }, { ...env, ...bindings });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GET /api/v1/auth/me (fake gateway through env.__deps)', () => {
  const supabase = createFakeSupabaseGateway(
    {
      't-jose': { id: 'u-jose', email: 'jose@test', aal: 'aal1' },
      't-ana': { id: 'u-ana', email: 'ana@test', aal: 'aal1' },
    },
    ['u-jose'],
  );
  const hooks = { TEST: '1', __deps: { supabase } };

  it('returns id, email and is_admin, and nothing else of the Auth user', async () => {
    const res = await me('t-jose', hooks);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, data: { id: 'u-jose', email: 'jose@test', is_admin: true } });
    expect(await (await me('t-ana', hooks)).json()).toEqual({
      ok: true,
      data: { id: 'u-ana', email: 'ana@test', is_admin: false },
    });
  });

  it('answers 502 when the admin check cannot reach Supabase', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const down = createFakeSupabaseGateway({ t: { id: 'u', email: null, aal: null } });
    down.isAdmin = async () => {
      throw new Error('SUPABASE_SECRET_KEY is required');
    };
    const res = await me('t', { TEST: '1', __deps: { supabase: down } });
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ ok: false, error: { code: 'upstream_error' } });
  });
});

describe('GET /api/v1/auth/me (real adapters, in-memory Supabase)', () => {
  it('jose@test (staff_members admin) gets is_admin: true; ana@test false; a bad JWT 401', async () => {
    const secret = 'sb_secret_test_0123456789abcdef';
    const sb = createFakeSupabase({ secret });
    const jose = fakeJwt('u-jose', 'aal1');
    const ana = fakeJwt('u-ana', 'aal1');
    sb.users.push({ id: 'u-jose', email: 'jose@test', jwt: jose }, { id: 'u-ana', email: 'ana@test', jwt: ana });
    sb.staff.add('u-jose');
    vi.stubGlobal('fetch', sb.fetch);

    const josesMe = await me(jose, { SUPABASE_SECRET_KEY: secret });
    expect(await josesMe.json()).toEqual({ ok: true, data: { id: 'u-jose', email: 'jose@test', is_admin: true } });
    expect(await (await me(ana, { SUPABASE_SECRET_KEY: secret })).json()).toMatchObject({ data: { is_admin: false } });
    expect((await me('forged', { SUPABASE_SECRET_KEY: secret })).status).toBe(401);
  });
});
