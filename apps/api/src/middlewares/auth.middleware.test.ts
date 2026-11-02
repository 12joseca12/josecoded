import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { requireAdmin, requireStaff, requireUser, type AuthEnv, type StaffEnv } from './auth.middleware';
import { createFakeClock } from '../../test/fakes/clock.fake';
import { createFakeSupabaseGateway } from '../../test/fakes/supabase.fake';

import type { Env } from '../types/env.types';
import type { AuthUser } from '@josecoded/types';

const env = {
  API_MODE: 'development',
  WORKER_URL: 'http://worker.test',
  WORKER_INTERNAL_TOKEN: 'test-internal-token-12345',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'http://127.0.0.1:54321',
} satisfies Env;

const jose: AuthUser = { id: 'u-jose', email: 'jose@test', aal: 'aal2' };
const joseNoTotp: AuthUser = { ...jose, aal: 'aal1' };
const ana: AuthUser = { id: 'u-ana', email: 'ana@test', aal: 'aal1' };

function app(supabase = createFakeSupabaseGateway({ 't-jose': jose, 't-jose-aal1': joseNoTotp, 't-ana': ana }, ['u-jose'])) {
  const a = new Hono<AuthEnv>();
  a.use('*', async (c, next) => {
    c.set('deps', { clock: createFakeClock(), supabase });
    await next();
  });
  a.get('/me', requireUser, (c) => c.json(c.var.user));
  a.get('/admin', requireAdmin, (c) => c.json({ admin: c.var.user.id }));
  return { a, supabase };
}

const get = (a: Hono<AuthEnv>, path: string, token?: string, bindings: Partial<Env> = {}) =>
  a.request(path, token ? { headers: { Authorization: token } } : {}, { ...env, ...bindings });

describe('requireUser', () => {
  it('leaves the verified user in c.var.user', async () => {
    const res = await get(app().a, '/me', 'Bearer t-ana');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(ana);
  });

  it.each([
    [undefined, 'Missing authorization header'],
    ['Basic abc', 'Invalid authorization header'],
    ['Bearer unknown', 'Invalid or expired session'],
  ])('answers 401 for %s', async (token, message) => {
    const res = await get(app().a, '/me', token);
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ ok: false, error: { code: 'unauthorized', message } });
  });

  it('answers 502 (not 401) when Supabase Auth is unreachable, so the client does not drop the session', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { a, supabase } = app();
    supabase.outage = new Error('connect ECONNREFUSED');
    const res = await get(a, '/me', 'Bearer t-ana');
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ ok: false, error: { code: 'upstream_error' } });
    errors.mockRestore();
  });
});

describe('requireAdmin (DATOS Q3: staff_members + TOTP)', () => {
  it('lets an admin with aal2 through', async () => {
    const res = await get(app().a, '/admin', 'Bearer t-jose');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ admin: 'u-jose' });
  });

  it('refuses a user who is not staff with 403', async () => {
    const res = await get(app().a, '/admin', 'Bearer t-ana');
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ ok: false, error: { code: 'forbidden', message: 'Admin only' } });
  });

  it('refuses an admin session without a second factor (aal1) with mfa_required', async () => {
    const res = await get(app().a, '/admin', 'Bearer t-jose-aal1');
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: { code: 'forbidden', details: { reason: 'mfa_required' } } });
  });

  it.each(['true', '', 'False', undefined])('keeps requiring aal2 when ADMIN_REQUIRE_MFA is %j', async (value) => {
    const res = await get(app().a, '/admin', 'Bearer t-jose-aal1', { ADMIN_REQUIRE_MFA: value });
    expect(res.status).toBe(403);
  });

  it("accepts aal1 only when ADMIN_REQUIRE_MFA is exactly 'false' (local runs without TOTP)", async () => {
    const res = await get(app().a, '/admin', 'Bearer t-jose-aal1', { ADMIN_REQUIRE_MFA: 'false' });
    expect(res.status).toBe(200);
    // the role is still required
    expect((await get(app().a, '/admin', 'Bearer t-ana', { ADMIN_REQUIRE_MFA: 'false' })).status).toBe(403);
  });

  it('answers 401 without a session, before looking at the role', async () => {
    const { a, supabase } = app();
    const isAdmin = vi.spyOn(supabase, 'isAdmin');
    expect((await get(a, '/admin')).status).toBe(401);
    expect(isAdmin).not.toHaveBeenCalled();
  });
});

describe('requireStaff (DATOS Q24: active admin or closer, aal2 for both)', () => {
  const carla: AuthUser = { id: 'u-carla', email: 'carla@test', aal: 'aal2' };
  const carlaNoTotp: AuthUser = { ...carla, aal: 'aal1' };
  const dani: AuthUser = { id: 'u-dani', email: 'dani@test', aal: 'aal2' };

  function staffApp() {
    const supabase = createFakeSupabaseGateway(
      { 't-jose': jose, 't-jose-aal1': joseNoTotp, 't-ana': ana, 't-carla': carla, 't-carla-aal1': carlaNoTotp, 't-dani': dani },
      ['u-jose'],
      ['u-carla'], // dani is a deactivated closer: the gateway never reports her
    );
    const a = new Hono<StaffEnv>();
    a.use('*', async (c, next) => {
      c.set('deps', { clock: createFakeClock(), supabase });
      await next();
    });
    a.get('/staff', requireStaff, (c) => c.json({ role: c.var.staffRole, id: c.var.user.id }));
    return { a: a as unknown as Hono<AuthEnv>, supabase };
  }

  it('lets an admin and an active closer through with aal2, leaving the role', async () => {
    const { a } = staffApp();
    const closer = await get(a, '/staff', 'Bearer t-carla');
    expect(closer.status).toBe(200);
    expect(await closer.json()).toEqual({ role: 'closer', id: 'u-carla' });
    expect(await (await get(a, '/staff', 'Bearer t-jose')).json()).toEqual({ role: 'admin', id: 'u-jose' });
  });

  it('refuses a closer with a first-factor session (aal1) with mfa_required: no route accepts it', async () => {
    const res = await get(staffApp().a, '/staff', 'Bearer t-carla-aal1');
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ ok: false, error: { code: 'forbidden', details: { reason: 'mfa_required' } } });
    expect((await get(staffApp().a, '/staff', 'Bearer t-jose-aal1')).status).toBe(403);
  });

  it('answers 404 for a client and for a deactivated closer, even with aal2', async () => {
    expect((await get(staffApp().a, '/staff', 'Bearer t-ana')).status).toBe(404);
    const res = await get(staffApp().a, '/staff', 'Bearer t-dani');
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: { code: 'not_found' } });
  });

  it("lifts only the second factor when ADMIN_REQUIRE_MFA is exactly 'false'", async () => {
    expect((await get(staffApp().a, '/staff', 'Bearer t-carla-aal1', { ADMIN_REQUIRE_MFA: 'false' })).status).toBe(200);
    expect((await get(staffApp().a, '/staff', 'Bearer t-carla-aal1', { ADMIN_REQUIRE_MFA: 'False' })).status).toBe(403);
    expect((await get(staffApp().a, '/staff', 'Bearer t-ana', { ADMIN_REQUIRE_MFA: 'false' })).status).toBe(404);
  });

  it('answers 401 without a session and 502 when the role cannot be checked', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { a, supabase } = staffApp();
    expect((await get(a, '/staff')).status).toBe(401);
    vi.spyOn(supabase, 'staffRole').mockRejectedValue(new Error('down'));
    expect((await get(a, '/staff', 'Bearer t-carla')).status).toBe(502);
    errors.mockRestore();
  });
});
