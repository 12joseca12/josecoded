'use client';

import { useEffect } from 'react';

import { refCookie, refFromSearch } from '@/lib/area/ref-cookie';

/**
 * Remembers `?ref=CODE` of a public page in the `ref` cookie (30 days) so the later sign-in can attribute
 * the account to the referrer. It reads `window.location` after mount instead of `useSearchParams`, so
 * the static pages stay static; it renders nothing. A malformed code is ignored; a valid new one replaces
 * the old (last link wins).
 */
export function RefCapture() {
  useEffect(() => {
    const code = refFromSearch(window.location.search);
    if (code) document.cookie = refCookie(code, window.location.protocol === 'https:');
  }, []);
  return null;
}
