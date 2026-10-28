/**
 * CORS allow-list matching (DT §3.6, finding 32).
 *
 * Each entry of the comma-separated list is one of:
 * - an exact origin (`https://josecoded.com`);
 * - `https://*-<rest>`: a Workers preview (`<hash>-<worker>.<sub>.workers.dev`). The star is one or more
 *   `[a-z0-9]` followed by a DASH and then exactly `<rest>`. The dash is part of the rule: a bare
 *   `https://josecoded-web...` (no hash) or `https://x.jose.workers.dev` do not match;
 * - `https://*.<host>`: any subdomain, i.e. a host suffix preceded by a dot (never a bare `endsWith`).
 *
 * Matching is done on the whole origin string, so a suffix such as `.evil.com` can never slip through.
 * Any hash is accepted for previews, evil ones included: previews have no production data (DT §0b).
 */

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Hostname labels allowed in a wildcard subdomain (`https://*.<host>`). */
const SUBDOMAIN_LABEL = '[a-z0-9]+(?:-[a-z0-9]+)*';

function entryToRegExp(entry: string): RegExp | undefined {
  const dashPrefix = 'https://*-';
  const dotPrefix = 'https://*.';
  if (entry.startsWith(dashPrefix)) {
    return new RegExp(`^https://[a-z0-9]+-${escapeRegExp(entry.slice(dashPrefix.length))}$`);
  }
  if (entry.startsWith(dotPrefix)) {
    return new RegExp(
      `^https://(?:${SUBDOMAIN_LABEL}\\.)+${escapeRegExp(entry.slice(dotPrefix.length))}$`,
    );
  }
  return undefined;
}

export function parseOriginList(list: string): string[] {
  return list
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isAllowedOrigin(origin: string, list: string): boolean {
  if (!origin) return false;
  for (const entry of parseOriginList(list)) {
    if (entry.includes('*')) {
      if (entryToRegExp(entry)?.test(origin)) return true;
    } else if (entry === origin) {
      return true;
    }
  }
  return false;
}
