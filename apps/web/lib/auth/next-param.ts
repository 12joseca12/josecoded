/**
 * Where to go after signing in. Only an internal, absolute path is accepted: anything else
 * (another origin, `//host`, `/\host`, a scheme, control characters) becomes `/`. This is the single
 * guard against open redirects, used by the callback route, the sign-in actions and the guards.
 */
export function safeNext(next: string | null | undefined, fallback = '/'): string {
  if (typeof next !== 'string' || next.length === 0 || next.length > 512) return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
   
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
  // a parsed URL must keep our origin: this catches encodings the checks above missed
  try {
    const url = new URL(next, 'http://internal.invalid');
    if (url.origin !== 'http://internal.invalid') return fallback;
  } catch {
    return fallback;
  }
  return next;
}
