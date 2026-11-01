// The visitor session of the case-based chat: `__Host-chat_sid=<visitor uuid>.<HMAC>` in an HttpOnly cookie (task 4.4,
// spec §0.4). The uuid is `chat_threads.visitor_id`; the signature (a subkey derived from CHAT_SID_SECRET) makes it
// impossible to adopt someone else's id by guessing it. The `__Host-` prefix makes the browser refuse the cookie
// unless it is Secure, has Path=/ and carries no Domain, so a sibling subdomain cannot plant or overwrite it.
import { deriveKey, hmacSha256, verifyHmacSha256 } from '../utils/crypto';
import { HttpError } from '../utils/http-error';

/** Name used everywhere over https (always in production). */
export const CHAT_COOKIE = '__Host-chat_sid';
/** Plain-http `wrangler dev` only (API_MODE=development): browsers refuse `__Host-` without Secure. */
export const CHAT_COOKIE_DEV = 'chat_sid';
export const CHAT_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function signVisitorSid(secret: string, visitorId: string): Promise<string> {
  return `${visitorId}.${await hmacSha256(await deriveKey(secret, 'chat-cookie'), visitorId)}`;
}

/**
 * The visitor id of a genuine session cookie in a `Cookie` header; `null` for a missing, malformed or forged one.
 * More than one session cookie (a duplicate, or `chat_sid` next to `__Host-chat_sid`) is a 400: a planted cookie must
 * not be silently picked over the real one. The unprefixed name is read only with `allowDevName` (API_MODE=development).
 */
export async function readVisitorSid(
  secret: string | undefined,
  cookieHeader: string | undefined,
  options: { allowDevName?: boolean } = {},
): Promise<string | null> {
  if (!secret || !cookieHeader) return null;
  const names = options.allowDevName ? [CHAT_COOKIE, CHAT_COOKIE_DEV] : [CHAT_COOKIE];
  const found = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter((part) => names.some((name) => part.startsWith(`${name}=`)));
  if (found.length > 1) throw new HttpError(400, 'invalid_request', 'Invalid session cookie');
  const part = found[0];
  if (!part) return null;
  const raw = part.slice(part.indexOf('=') + 1);
  const [visitorId, signature, ...rest] = raw.split('.');
  if (!visitorId || !signature || rest.length > 0 || !UUID.test(visitorId)) return null;
  return (await verifyHmacSha256(await deriveKey(secret, 'chat-cookie'), visitorId, signature)) ? visitorId : null;
}

/**
 * `Set-Cookie` value. Secure => `__Host-chat_sid` (Secure, Path=/, no Domain). Only a non-secure response (plain-http
 * development) falls back to the unprefixed name, which the caller allows only in API_MODE=development.
 */
export function sidCookie(value: string, secure: boolean): string {
  const name = secure ? CHAT_COOKIE : CHAT_COOKIE_DEV;
  return `${name}=${value}; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Path=/; Max-Age=${CHAT_COOKIE_MAX_AGE}`;
}
