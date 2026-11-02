import { env } from '@/lib/env';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface SiteverifyResponse {
  success: boolean;
  action?: string;
  hostname?: string;
}

/**
 * Verifies a Turnstile token with Cloudflare, on the server only (the secret never reaches the
 * browser). A token is single use, so the widget is reset after every submission. Returns false on
 * any failure, network included: the forms fail closed. The `hostname` Cloudflare saw must be the one of
 * `NEXT_PUBLIC_SITE_URL`. The sign-in does not use this (Supabase Auth verifies its own token); it stays
 * for the web's own forms.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  options: { ip?: string | null; action?: string } = {},
): Promise<boolean> {
  if (!token) return false;
  const body = new URLSearchParams({ secret: env.server.TURNSTILE_SECRET_KEY, response: token });
  if (options.ip) body.set('remoteip', options.ip);
  const siteHost = new URL(env.client.NEXT_PUBLIC_SITE_URL).hostname;
  try {
    const res = await fetch(SITEVERIFY, { method: 'POST', body, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const data = (await res.json()) as SiteverifyResponse;
    if (!data.success) return false;
    // a token solved on another site (same sitekey reused, or a proxy page) is not ours
    if (data.hostname !== siteHost) return false;
    return options.action ? data.action === options.action : true;
  } catch {
    return false;
  }
}
