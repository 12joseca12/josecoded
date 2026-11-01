import { isAllowedOrigin } from './cors-origins';
import { normalizeIp } from './crypto';
import { HttpError } from './http-error';

import type { Env } from '../types/env.types';
import type { Context } from 'hono';
import type { ZodType, z } from 'zod';

/** The caller's IP as Cloudflare saw it. `cf-connecting-ip` is set by the edge and cannot be forged by the client. */
export function clientIp(c: Context): string {
  return c.req.header('cf-connecting-ip')?.trim() || 'unknown';
}

/** `clientIp` as a limiter key: an IPv6 counts by its /64, so rotating its lower bits does not dodge a limit. */
export function clientRateKey(c: Context): string {
  return normalizeIp(clientIp(c));
}

/** Whether a browser `Origin` may call the gateway: the CORS allow-list, plus localhost in development with no list. */
export function isOriginAllowed(env: Pick<Env, 'API_MODE' | 'CORS_ORIGINS'>, origin: string): boolean {
  if (env.CORS_ORIGINS.trim()) return isAllowedOrigin(origin, env.CORS_ORIGINS);
  return env.API_MODE === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

/**
 * CSRF guard for requests authenticated by a cookie: a browser always sends `Origin` on a cross-site POST, so one
 * that is not on the allow-list is refused. A request with no `Origin` is not a browser form post and passes.
 */
export function assertTrustedOrigin(c: {
  req: { header(name: string): string | undefined };
  env: Pick<Env, 'API_MODE' | 'CORS_ORIGINS'>;
}): void {
  const origin = c.req.header('origin');
  if (origin && !isOriginAllowed(c.env, origin)) throw new HttpError(403, 'forbidden', 'Origin not allowed');
}

/**
 * Reads the JSON body with a hard size cap, counting bytes while streaming (the `content-length` header can lie or
 * be absent). 415 for another content type, 413 above the cap, 400 for malformed JSON.
 */
export async function readJsonBody(c: Context, maxBytes: number): Promise<unknown> {
  const type = c.req.header('content-type') ?? '';
  if (!/^application\/json(\s*;|$)/i.test(type)) {
    throw new HttpError(415, 'unsupported_media_type', 'Content-Type must be application/json');
  }
  const declared = Number(c.req.header('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new HttpError(413, 'payload_too_large', 'Request body too large');
  }
  const body = c.req.raw.body;
  if (!body) throw new HttpError(400, 'invalid_request', 'Request body is required');

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new HttpError(413, 'payload_too_large', 'Request body too large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new HttpError(400, 'invalid_request', 'Malformed JSON');
  }
}

/** Parses with a zod schema; the 400 names the failing paths and codes, never the values received. */
export function parseWith<S extends ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw new HttpError(400, 'invalid_request', 'Invalid request', {
    details: { issues: result.error.issues.slice(0, 10).map((i) => ({ path: i.path.join('.'), code: i.code })) },
  });
}

export async function readJson<S extends ZodType>(c: Context, schema: S, maxBytes: number): Promise<z.output<S>> {
  return parseWith(schema, await readJsonBody(c, maxBytes));
}
