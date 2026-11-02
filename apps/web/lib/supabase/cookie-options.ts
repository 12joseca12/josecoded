import { env } from '@/lib/env';

/**
 * Attributes of the Supabase session cookies, the same for the server and the browser clients.
 * `Secure` follows the site origin (an http local preview or CI cannot keep a Secure cookie);
 * `SameSite=Lax` keeps the session out of cross-site sub-requests but lets the OAuth return in.
 * Not `HttpOnly`: the browser client of the header reads the session from the same cookie.
 */
export function supabaseCookieOptions(siteUrl: string = env.client.NEXT_PUBLIC_SITE_URL) {
  return {
    path: '/',
    sameSite: 'lax' as const,
    secure: siteUrl.startsWith('https://'),
  };
}
