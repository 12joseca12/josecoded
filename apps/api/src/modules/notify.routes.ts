// POST /api/v1/notify/test: the admin checks that the bot reaches him (task 3.8b). Admin with a second factor (`requireAdmin`);
// five tests per ten minutes; the text is fixed.
import { Hono } from 'hono';

import { requireAdmin, type AuthEnv } from '../middlewares/auth.middleware';
import { ok } from '../utils/api-response';
import { HttpError } from '../utils/http-error';

export const notifyRoutes = new Hono<AuthEnv>();

const TEST_LIMIT = 5;
const TEST_WINDOW_SECONDS = 600;
export const TEST_MESSAGE = 'Aviso de prueba del CRM: si lo lees, Telegram funciona.';

notifyRoutes.post('/test', requireAdmin, async (c) => {
  c.header('Cache-Control', 'no-store');
  const { telegram, quota } = c.var.deps;
  if (!telegram) throw new HttpError(503, 'service_unavailable', 'Telegram is not configured');
  if (quota && !(await quota.hit(`notifytest:${c.var.user.id}`, TEST_LIMIT, TEST_WINDOW_SECONDS))) {
    throw new HttpError(429, 'rate_limited', 'Too many tests', { headers: { 'Retry-After': String(TEST_WINDOW_SECONDS) } });
  }
  try {
    await telegram.sendMessage(TEST_MESSAGE);
  } catch {
    throw new HttpError(502, 'upstream_error', 'Telegram did not accept the message');
  }
  return c.json(ok({ sent: true }));
});
