import { fail } from '../utils/api-response';
import { normalizeIp } from '../utils/crypto';
import { HttpError } from '../utils/http-error';

import type { Env } from '../types/env.types';
import type { Context, MiddlewareHandler } from 'hono';

export type RateLimiterBinding = { limit(opts: { key: string }): Promise<{ success: boolean }> };

function getClientId(c: Context): string {
  const ip = c.req.header('cf-connecting-ip')?.trim() || c.req.header('x-real-ip')?.trim();
  return ip ? normalizeIp(ip) : 'unknown';
}

/** Rate-limit con el binding nativo de Cloudflare. Sus contadores son por ubicación de Cloudflare (eventualmente
 *  consistentes), no globales: ponen un techo aproximado por punto de presencia, y los topes diarios exactos
 *  viven en `increment_quota`. La IP se normaliza (un IPv6 cuenta por su /64).
 *  Sin binding (dev local) hace fail-open para no romper `wrangler dev`. */
export function nativeRateLimit(
  getLimiter: (env: Env) => RateLimiterBinding | undefined,
  opts: { keyPrefix: string },
): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const limiter = getLimiter(c.env);
    if (!limiter) return next();
    const key = `${opts.keyPrefix}:${getClientId(c)}`;
    let success: boolean;
    try {
      ({ success } = await limiter.limit({ key }));
    } catch {
      // Fail-closed: si el binding del rate limiter falla, bloqueamos para
      // proteger el LLM auto-hospedado en vez de dejar pasar (fail-open).
      c.header('Retry-After', '60');
      return c.json(fail('rate_limited', 'Too many requests'), 503);
    }
    if (!success) {
      c.header('Retry-After', '60');
      return c.json(fail('rate_limited', 'Too many requests'), 429);
    }
    return next();
  };
}

/**
 * The same limiter for a handler that knows the key only after reading the request (a visitor id, a valid server
 * key). Throws the 429 / 503 of the middleware; no binding (local dev, tests) lets the request through.
 */
export async function enforceNativeLimit(limiter: RateLimiterBinding | undefined, key: string): Promise<void> {
  if (!limiter) return;
  let success: boolean;
  try {
    ({ success } = await limiter.limit({ key }));
  } catch {
    // fail closed, as the middleware does
    throw new HttpError(503, 'rate_limited', 'Too many requests', { headers: { 'Retry-After': '60' } });
  }
  if (!success) throw new HttpError(429, 'rate_limited', 'Too many requests', { headers: { 'Retry-After': '60' } });
}
