// Response headers of the production site (task "security headers"). The static ones are the same on every response and
// live in three places that must agree: this list (next.config `headers()` for what Next serves), `public/_headers` (what
// the assets binding serves without waking the worker; a test compares both) and, for the CSP, `with-csp.ts` in the worker.
// HSTS has no `preload`: submitting the domain to the preload list is irreversible for a long time, so it is Jose's call.

export interface HeaderEntry {
  key: string;
  value: string;
}

export const STATIC_SECURITY_HEADERS: readonly HeaderEntry[] = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/** Previews (`*.workers.dev`) are never indexed, whatever the page says. */
export const PREVIEW_HEADERS: readonly HeaderEntry[] = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
