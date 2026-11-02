// Referral attribution: a public page opened with `?ref=CODE` remembers the code for 30 days, and the
// sign-in (OTP action and OAuth callback) reads it to mark the account as `referral`. The cookie is a
// plain attribution hint, not a credential: the server validates the format again and the database
// decides what the code means, so it needs neither HttpOnly nor a signature.

/**
 * Copy of `AFFILIATE_CODE_RE` (@josecoded/pricing): this module ships to every public page, and the pricing
 * package barrel carries the price data. A test compares both.
 */
export const REF_CODE_RE = /^[A-Z0-9]{3,12}-[A-Z0-9]{6}$/;

export const REF_COOKIE = 'ref';
export const REF_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** The normalized code of a `?ref=` value, or null when it is not a well-formed affiliate code. */
export function refFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get('ref');
  const code = value?.trim().toUpperCase();
  return code !== undefined && REF_CODE_RE.test(code) ? code : null;
}

/** The `document.cookie` assignment for a code (SameSite=Lax, 30 days, site-wide). */
export function refCookie(code: string, secure: boolean): string {
  return `${REF_COOKIE}=${code}; Max-Age=${REF_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
}
