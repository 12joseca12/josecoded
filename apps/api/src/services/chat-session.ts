// The visitor session of the case-based chat: `chat_sid=<visitor uuid>.<HMAC>` in an HttpOnly cookie (task 4.4, spec
// §0.4). The uuid is `chat_threads.visitor_id`; the signature (CHAT_SID_SECRET) makes it impossible to adopt someone
// else's id by guessing it.
import { hmacSha256, verifyHmacSha256 } from '../utils/crypto';

export const CHAT_COOKIE = 'chat_sid';
export const CHAT_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function signVisitorSid(secret: string, visitorId: string): Promise<string> {
  return `${visitorId}.${await hmacSha256(secret, visitorId)}`;
}

/** The visitor id of a genuine `chat_sid` in a `Cookie` header; `null` for a missing, malformed or forged one. */
export async function readVisitorSid(secret: string | undefined, cookieHeader: string | undefined): Promise<string | null> {
  if (!secret || !cookieHeader) return null;
  const raw = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CHAT_COOKIE}=`))
    ?.slice(CHAT_COOKIE.length + 1);
  if (!raw) return null;
  const [visitorId, signature, ...rest] = raw.split('.');
  if (!visitorId || !signature || rest.length > 0 || !UUID.test(visitorId)) return null;
  return (await verifyHmacSha256(secret, visitorId, signature)) ? visitorId : null;
}

/** `Set-Cookie` value. `Secure` always except plain-http development. */
export function sidCookie(value: string, secure: boolean): string {
  return `${CHAT_COOKIE}=${value}; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Path=/; Max-Age=${CHAT_COOKIE_MAX_AGE}`;
}
