/**
 * Supabase keeps the session in cookies named `sb-<project>-auth-token` (split in `.0`, `.1`… when
 * large). Seeing one is the only thing the header needs to know before it decides whether to load
 * the Supabase client at all: visitors without a session never download it.
 */
export function hasSessionCookie(cookie: string): boolean {
  return cookie.split(';').some((part) => /^\s*sb-[^=\s]+-auth-token(\.\d+)?=/.test(part));
}
