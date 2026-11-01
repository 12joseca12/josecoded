import { Hono } from 'hono';

import { affiliateValidateQuerySchema, AFFILIATE_CODE_DB_RE, leadRequestSchema } from '@josecoded/types';

import { enforceNativeLimit, nativeRateLimit } from '../middlewares/native-rate-limit.middleware';
import { submitLead } from '../services/leads.service';
import { ok } from '../utils/api-response';
import { secretsEqual } from '../utils/crypto';
import { HttpError, logEvent } from '../utils/http-error';
import { clientIp, clientRateKey, parseWith, readJson } from '../utils/request';

import type { AppEnv } from '../deps';
import type { Context } from 'hono';

const MAX_BODY_BYTES = 16 * 1024;
/** Widget actions the web uses for the contact form, the proposal send step and the partner form. */
const TURNSTILE_ACTIONS = ['contact', 'proposal_send', 'partner'] as const;

export const leadsRoutes = new Hono<AppEnv>();
export const affiliatesRoutes = new Hono<AppEnv>();

/** The caller's session, if any. A bad or unreachable session never blocks a lead: it is just not linked. */
async function optionalUserId(c: Context<AppEnv>): Promise<string | undefined> {
  const header = c.req.header('authorization');
  const token = header ? /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim() : undefined;
  if (!token) return undefined;
  try {
    return (await c.var.deps.supabase.verifyUser(token))?.id;
  } catch {
    logEvent('leads', 'verify_user_failed');
    return undefined;
  }
}

/**
 * POST /api/v1/leads. Auth: `x-josecoded-server-key` (Cal.com webhook through apps/web; no rate limit, no Turnstile)
 * or a Turnstile token (`contact`, `proposal_send`, `partner`) plus LEADS_RATE_LIMITER 5/min per IP. A server key that
 * is present but wrong is a 403, never a fallback to Turnstile. Body up to 16 KiB, idempotent by `idempotencyKey`.
 */
leadsRoutes.post('/', async (c) => {
  const { deps } = c.var;
  const ip = clientIp(c);
  const presented = c.req.header('x-josecoded-server-key');

  let serverAuthenticated = false;
  if (presented !== undefined) {
    const expected = c.env.SERVER_KEY;
    if (!expected || !(await secretsEqual(presented, expected))) throw new HttpError(403, 'forbidden', 'Invalid server key');
    serverAuthenticated = true;
  } else {
    await enforceNativeLimit(c.env.LEADS_RATE_LIMITER, `leads:${clientRateKey(c)}`);
  }

  const request = await readJson(c, leadRequestSchema, MAX_BODY_BYTES);

  if (!serverAuthenticated) {
    if (!request.turnstileToken) throw new HttpError(403, 'bot_check_failed', 'Bot check required');
    if (!deps.turnstile) throw new HttpError(503, 'service_unavailable', 'Bot check is not configured');
    const verdict = await deps.turnstile.verify(request.turnstileToken, ip, TURNSTILE_ACTIONS);
    if (verdict === 'unavailable') throw new HttpError(503, 'service_unavailable', 'Bot check unavailable');
    if (verdict === 'failed') throw new HttpError(403, 'bot_check_failed', 'Bot check failed');
  }

  const userId = await optionalUserId(c);
  const result = await submitLead(deps, request, {
    serverAuthenticated,
    ...(userId ? { userId } : {}),
    ...(c.env.SERVER_KEY ? { serverKey: c.env.SERVER_KEY } : {}),
    waitUntil: (promise) => {
      try {
        c.executionCtx.waitUntil(promise);
      } catch {
        // no execution context (unit tests): the promise runs anyway
      }
    },
  });
  c.header('Cache-Control', 'no-store');
  return c.json(ok(result.body), result.status);
});

/** GET /api/v1/affiliates/validate?code=: AFFILIATE_RATE_LIMITER 30/min per IP. A malformed code is simply not valid. */
affiliatesRoutes.get(
  '/validate',
  nativeRateLimit((env) => env.AFFILIATE_RATE_LIMITER, { keyPrefix: 'affiliates' }),
  async (c) => {
    const { code } = parseWith(affiliateValidateQuerySchema, { code: c.req.query('code') });
    const normalized = code.toUpperCase();
    let valid = false;
    if (AFFILIATE_CODE_DB_RE.test(normalized)) {
      try {
        valid = (await c.var.deps.affiliates?.findOwner(normalized)) != null;
      } catch {
        logEvent('affiliates', 'validate_failed');
        throw new HttpError(502, 'upstream_error', 'Could not validate the code');
      }
    }
    c.header('Cache-Control', 'no-store');
    return c.json(ok({ valid }));
  },
);
