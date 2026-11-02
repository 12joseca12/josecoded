// POST /api/v1/telegram/webhook: the bot's webhook (task 3.8b), the alternative to the `telegram.poll_updates` job. Telegram sends
// `X-Telegram-Bot-Api-Secret-Token` (the `secret_token` given to `setWebhook`); without the same value in TELEGRAM_WEBHOOK_SECRET
// the route does not exist (404), and with a wrong or missing header it answers 401. The comparison is constant time. Only a
// private `/start <code>` message does anything (services/telegram-link.ts); every authentic update gets a 200 so
// Telegram does not retry it, and nothing of the message is logged.
import { Hono } from 'hono';

import { handleTelegramUpdate } from '../services/telegram-link';
import { fail, ok } from '../utils/api-response';
import { secretsEqual } from '../utils/crypto';
import { readJsonBody } from '../utils/request';
import { telegramUpdateSchema } from '../utils/telegram-update';

import type { AppEnv } from '../deps';

/** Telegram updates are a few hundred bytes; anything bigger is not from Telegram. */
const MAX_BODY_BYTES = 16 * 1024;

export const telegramRoutes = new Hono<AppEnv>();

telegramRoutes.post('/webhook', async (c) => {
  c.header('Cache-Control', 'no-store');
  const expected = c.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return c.json(fail('not_found', 'Route not found'), 404);
  const provided = c.req.header('x-telegram-bot-api-secret-token') ?? '';
  if (!(await secretsEqual(provided, expected))) return c.json(fail('unauthorized', 'Invalid secret token'), 401);

  const update = telegramUpdateSchema.safeParse(await readJsonBody(c, MAX_BODY_BYTES));
  if (update.success) await handleTelegramUpdate(c.var.deps, update.data);
  return c.json(ok({}));
});
