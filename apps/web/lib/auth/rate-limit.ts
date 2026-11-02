import { getCloudflareContext } from '@opennextjs/cloudflare';

// Throttle of the guessable steps (6-digit email code, TOTP code). Supabase Auth has its own limits
// (`token_verifications` per IP; see docs/runbooks/supabase-gate.md) but they are coarse and per IP only,
// so the web adds the two keys an attacker cannot rotate for free: the account (email / user id) and the
// network (IPv6 as its /64). It uses the Workers Rate Limiting binding of the web worker itself: no
// database round-trip, no secret key in the web (the web never holds the service key), nothing to clean up.
// The counters are per Cloudflare location and eventually consistent: a ceiling against guessing, not
// an exact quota.

interface RateLimitBinding {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
}

export type AttemptScope = 'otp' | 'totp';

/** The part of an address an attacker holds: the whole IPv4, or the first 64 bits of an IPv6. */
export function networkKey(ip: string | null | undefined): string {
  if (!ip) return 'unknown';
  const address = ip.trim().toLowerCase();
  if (!address.includes(':')) return address;
  const [head = '', tail = ''] = address.split('::');
  const left = head === '' ? [] : head.split(':');
  const right = tail === '' ? [] : tail.split(':');
  const groups = address.includes('::') ? [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right] : left;
  return `${groups
    .slice(0, 4)
    .map((group) => group.padStart(4, '0'))
    .join(':')}::/64`;
}

function bindings(): { ip: RateLimitBinding; subject: RateLimitBinding } | null | 'missing' {
  let env: Record<string, unknown>;
  try {
    env = getCloudflareContext().env as unknown as Record<string, unknown>;
  } catch {
    return null; // not running inside a Worker (next dev, unit tests, e2e against `next start`)
  }
  const ip = env.AUTH_IP_RATE_LIMITER as RateLimitBinding | undefined;
  const subject = env.AUTH_SUBJECT_RATE_LIMITER as RateLimitBinding | undefined;
  return ip && subject ? { ip, subject } : 'missing';
}

/**
 * True when this attempt may go ahead. Both keys count every attempt (right or wrong). Outside a Worker
 * there is nothing to count with and it allows; inside one, a missing binding is a deployment error and
 * it refuses (fail closed).
 */
export async function allowAttempt(
  scope: AttemptScope,
  input: { ip: string | null | undefined; subject: string },
): Promise<boolean> {
  const found = bindings();
  if (found === null) return true;
  if (found === 'missing') return false;
  const [byNetwork, bySubject] = await Promise.all([
    found.ip.limit({ key: `${scope}:ip:${networkKey(input.ip)}` }),
    found.subject.limit({ key: `${scope}:subject:${input.subject.toLowerCase()}` }),
  ]);
  return byNetwork.success && bySubject.success;
}
