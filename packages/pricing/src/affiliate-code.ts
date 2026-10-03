// Single contract of the affiliate code (DT §0b, finding 7). Shared by the gateway, the web and
// the SQL trigger `private.set_affiliate_code()`: the regex is copied literally into the
// migration (task 1.8) and a test there compares both.

/** `<prefix 3–12 alphanumerics>-<suffix of 6>`; the trigger builds the suffix with translate(…,'01','XZ'). */
export const AFFILIATE_CODE_RE = /^[A-Z0-9]{3,12}-[A-Z0-9]{6}$/;

const FALLBACK_PREFIX = 'REF';

/** Trim and uppercase what a person typed or what arrived in `?ref=`. */
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidCode(input: unknown): input is string {
  return typeof input === 'string' && AFFILIATE_CODE_RE.test(normalizeCode(input));
}

/** Default prefix: first given name, accents stripped, alphanumerics only, at most 12 characters. */
export function suggestPrefix(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  const clean = first
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
  return clean.length >= 3 ? clean : FALLBACK_PREFIX;
}
