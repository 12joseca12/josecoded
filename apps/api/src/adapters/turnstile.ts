// Real adapter of the TurnstileVerifier port: Cloudflare Turnstile siteverify (https://developers.cloudflare.com/turnstile/).
import type { TurnstileVerifier } from '../ports';
import type { Env } from '../types/env.types';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 5000;

/** `*-suffix` and `*.suffix` entries match a host that ends with the rest (previews); the others match exactly. */
export function hostnameAllowed(hostname: string, list: string): boolean {
  const host = hostname.toLowerCase();
  return list
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) =>
      entry.startsWith('*') ? host.length > entry.length - 1 && host.endsWith(entry.slice(1)) : host === entry,
    );
}

/**
 * `undefined` without TURNSTILE_SECRET_KEY (routes answer 503: a missing secret must never mean "no bot check").
 * In production the hostname of the token must be listed in ALLOWED_TURNSTILE_HOSTNAMES; without the list the
 * verdict is `unavailable`. Development accepts any hostname when no list is set.
 */
export function createTurnstileVerifier(env: Env, fetchImpl: typeof fetch = fetch): TurnstileVerifier | undefined {
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return undefined;
  const hostnames = env.ALLOWED_TURNSTILE_HOSTNAMES?.trim() ?? '';
  const requireHostnames = env.API_MODE === 'production';
  return {
    async verify(token, ip, actions) {
      if (requireHostnames && !hostnames) return 'unavailable';
      const form = new URLSearchParams({ secret, response: token });
      if (ip !== 'unknown') form.set('remoteip', ip);
      let result: { success?: unknown; action?: unknown; hostname?: unknown };
      try {
        const res = await fetchImpl(SITEVERIFY, {
          method: 'POST',
          body: form,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) return 'unavailable';
        result = (await res.json()) as typeof result;
      } catch {
        return 'unavailable';
      }
      if (result.success !== true) return 'failed';
      if (typeof result.action !== 'string' || !actions.includes(result.action)) return 'failed';
      if (hostnames && (typeof result.hostname !== 'string' || !hostnameAllowed(result.hostname, hostnames))) {
        return 'failed';
      }
      return 'ok';
    },
  };
}
