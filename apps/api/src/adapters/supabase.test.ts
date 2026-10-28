import { describe, expect, it } from 'vitest';

import { createSupabaseAdapters } from './supabase';
import { createFakeSupabase, fakeJwt } from '../../test/fakes/supabase-rest.fake';

import type { Env } from '../types/env.types';

const SECRET = 'sb_secret_test_0123456789abcdef';
const env = {
  API_MODE: 'development',
  WORKER_URL: 'http://worker.test',
  WORKER_INTERNAL_TOKEN: 'test-internal-token-12345',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key',
} satisfies Env;

function setup(withSecret = true) {
  const sb = createFakeSupabase({ secret: SECRET });
  const adapters = createSupabaseAdapters(withSecret ? { ...env, SUPABASE_SECRET_KEY: SECRET } : env, sb.fetch);
  return { sb, ...adapters };
}

describe('SupabaseGateway.verifyUser', () => {
  it('returns id, email and the aal of the JWT once Auth accepts it, with the publishable key as apikey', async () => {
    const { sb, gateway } = setup();
    const jwt = fakeJwt('u-jose', 'aal2');
    sb.users.push({ id: 'u-jose', email: 'jose@test', jwt });
    const seen: string[] = [];
    const spy: typeof fetch = async (input, init) => {
      seen.push(new Headers(init?.headers).get('apikey') ?? '');
      return sb.fetch(input, init);
    };

    const user = await createSupabaseAdapters(env, spy).gateway.verifyUser(jwt);

    expect(user).toEqual({ id: 'u-jose', email: 'jose@test', aal: 'aal2' });
    expect(seen).toEqual(['sb_publishable_test_key']);
    expect(await gateway.verifyUser(fakeJwt('u-jose', 'aal1'))).toBeNull();
  });

  it('reads aal1, and null for a token whose payload does not decode', async () => {
    const { sb, gateway } = setup();
    sb.users.push({ id: 'a', email: 'ana@test', jwt: fakeJwt('a', 'aal1') }, { id: 'b', email: 'b@test', jwt: 'x.%%%.y' });
    expect((await gateway.verifyUser(fakeJwt('a', 'aal1')))?.aal).toBe('aal1');
    expect((await gateway.verifyUser('x.%%%.y'))?.aal).toBeNull();
  });

  it('is null when Auth rejects the token and throws when Auth is down (not a bad session)', async () => {
    const { gateway } = setup();
    expect(await gateway.verifyUser('not-a-session')).toBeNull();
    const down = createSupabaseAdapters(env, async () => new Response('bad gateway', { status: 502 }));
    await expect(down.gateway.verifyUser('t')).rejects.toThrow('supabase auth: 502');
  });
});

describe('SupabaseGateway.isAdmin and the service client', () => {
  it('is true only for an admin row of staff_members, read with the secret key', async () => {
    const { sb, gateway } = setup();
    sb.staff.add('u-jose');
    expect(await gateway.isAdmin('u-jose')).toBe(true);
    expect(await gateway.isAdmin('u-ana')).toBe(false);
    expect(sb.requests).toContain('GET http://127.0.0.1:54321/rest/v1/staff_members');
  });

  it('turns a PostgREST error into an exception', async () => {
    const sb = createFakeSupabase({ secret: 'another-secret-entirely' });
    const { gateway } = createSupabaseAdapters({ ...env, SUPABASE_SECRET_KEY: SECRET }, sb.fetch);
    await expect(gateway.isAdmin('u-jose')).rejects.toThrow(/^staff_members: /);
  });

  it('without SUPABASE_SECRET_KEY: no RPC client, and isAdmin/admin() refuse', async () => {
    const { gateway, rpc } = setup(false);
    expect(rpc).toBeUndefined();
    await expect(gateway.isAdmin('u-jose')).rejects.toThrow('SUPABASE_SECRET_KEY is required');
    expect(() => gateway.admin()).toThrow('SUPABASE_SECRET_KEY is required');
  });

  it('the RPC client calls PostgREST /rpc with the secret key and creates one client per request', async () => {
    const { sb, gateway, rpc } = setup();
    sb.jobs.push({ name: 'outbox.drain', cron: '* * * * *', tz: null, next_run_at: '2026-10-28T09:00:00.000Z', enabled: true });
    const res = await rpc?.rpc('scheduled_jobs_due', { p_now: '2026-10-28T10:00:00.000Z' });
    expect(res?.error).toBeNull();
    expect(res?.data).toEqual([{ name: 'outbox.drain', cron: '* * * * *', tz: null, next_run_at: '2026-10-28T09:00:00.000Z' }]);
    expect(gateway.admin()).toBe(gateway.admin());
  });
});
