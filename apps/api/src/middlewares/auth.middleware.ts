// Auth gates of the gateway over `c.var.deps.supabase` (adapters/supabase.ts): a verified Supabase session, and
// for the admin routes a `staff_members` row plus a second factor (`aal2`, DATOS Q3).
import { createMiddleware } from 'hono/factory';

import { fail } from '../utils/api-response';

import type { StaffRole } from '../adapters/supabase';
import type { AppEnv } from '../deps';
import type { AuthUser } from '@josecoded/types';
import type { Context } from 'hono';

export type AuthEnv = AppEnv & { Variables: AppEnv['Variables'] & { user: AuthUser } };

export type StaffEnv = AuthEnv & { Variables: AuthEnv['Variables'] & { staffRole: StaffRole } };

function logAuthError(action: string, error: unknown): void {
  console.error(
    JSON.stringify({ scope: 'auth', action, message: error instanceof Error ? error.message : 'unknown' }),
  );
}

/** Verifies the bearer token and leaves the user in `c.var.user`; otherwise the response to send back. */
async function authenticate(c: Context<AuthEnv>): Promise<Response | undefined> {
  const header = c.req.header('authorization');
  if (!header) return c.json(fail('unauthorized', 'Missing authorization header'), 401);
  const token = /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim();
  if (!token) return c.json(fail('unauthorized', 'Invalid authorization header'), 401);

  let user: AuthUser | null;
  try {
    user = await c.var.deps.supabase.verifyUser(token);
  } catch (error) {
    // Auth unreachable is not a bad session: the client must not log the user out over it
    logAuthError('verify-user-failed', error);
    return c.json(fail('upstream_error', 'Auth service unavailable'), 502);
  }
  if (!user) return c.json(fail('unauthorized', 'Invalid or expired session'), 401);
  c.set('user', user);
  return undefined;
}

export const requireUser = createMiddleware<AuthEnv>(async (c, next) => {
  const denied = await authenticate(c);
  if (denied) return denied;
  await next();
});

/**
 * Admin = `requireUser` + an `admin` row in `staff_members` + `aal2`. The second factor is required unless
 * `ADMIN_REQUIRE_MFA` is exactly `'false'` (local runs: the seed accounts have no TOTP).
 */
export const requireAdmin = createMiddleware<AuthEnv>(async (c, next) => {
  const denied = await authenticate(c);
  if (denied) return denied;
  const user = c.var.user;

  let admin: boolean;
  try {
    admin = await c.var.deps.supabase.isAdmin(user.id);
  } catch (error) {
    logAuthError('is-admin-failed', error);
    return c.json(fail('upstream_error', 'Could not check the admin role'), 502);
  }
  if (!admin) return c.json(fail('forbidden', 'Admin only'), 403);
  if (c.env.ADMIN_REQUIRE_MFA !== 'false' && user.aal !== 'aal2') {
    return c.json(fail('forbidden', 'Second factor required', { reason: 'mfa_required' }), 403);
  }
  await next();
});

/**
 * Staff = `requireUser` + an ACTIVE `admin` or `closer` row in `staff_members` + `aal2` for both roles (DATOS
 * §14.12.4, Q24). For any route that accepts a closer's JWT: RLS cannot see `aal`, so this is where an `aal1` session
 * of a closer with an enrolled factor is stopped. Not staff (a deactivated closer included) is a 404, as in the web:
 * the CRM does not exist for them. The second factor is required unless `ADMIN_REQUIRE_MFA` is exactly `'false'`.
 * The role is left in `c.var.staffRole`; routes that are admin-only keep using `requireAdmin`.
 */
export const requireStaff = createMiddleware<StaffEnv>(async (c, next) => {
  // StaffEnv only adds a variable that is set below, after authenticating
  const denied = await authenticate(c as unknown as Context<AuthEnv>);
  if (denied) return denied;
  const user = c.var.user;

  let role: StaffRole | null;
  try {
    role = await c.var.deps.supabase.staffRole(user.id);
  } catch (error) {
    logAuthError('staff-role-failed', error);
    return c.json(fail('upstream_error', 'Could not check the staff role'), 502);
  }
  if (!role) return c.json(fail('not_found', 'Not found'), 404);
  if (c.env.ADMIN_REQUIRE_MFA !== 'false' && user.aal !== 'aal2') {
    return c.json(fail('forbidden', 'Second factor required', { reason: 'mfa_required' }), 403);
  }
  c.set('staffRole', role);
  await next();
});
