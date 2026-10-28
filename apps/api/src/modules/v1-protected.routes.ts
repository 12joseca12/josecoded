import { Hono } from 'hono';

import { requireUser, type AuthEnv } from '../middlewares/auth.middleware';
import { callWorker, toUpstreamFail } from '../services/worker.service';
import { fail, ok } from '../utils/api-response';

export const protectedV1Routes = new Hono<AuthEnv>();

// A wildcard gate: every path under /api/v1 not matched before this router answers 401 without a session.
protectedV1Routes.use('*', requireUser);

/** The session's user and whether it is staff (`staff_members`, read with the secret key; DATOS §9). */
protectedV1Routes.get('/auth/me', async (c) => {
  const { id, email } = c.var.user;
  try {
    const isAdmin = await c.var.deps.supabase.isAdmin(id);
    return c.json(ok({ id, email, is_admin: isAdmin }));
  } catch (error) {
    console.error(
      JSON.stringify({ scope: 'auth', action: 'me-is-admin-failed', message: error instanceof Error ? error.message : 'unknown' }),
    );
    return c.json(fail('upstream_error', 'Could not check the admin role'), 502);
  }
});

protectedV1Routes.get('/system/status', async (c) => {
  try {
    const data = await callWorker<unknown>(c.env, '/system/status');
    return c.json(ok(data));
  } catch (e) {
    return c.json(toUpstreamFail(e), 502);
  }
});
