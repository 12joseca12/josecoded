import { describe, expect, it } from 'vitest';

import { AFFILIATE_CODE_RE } from '@josecoded/pricing';

import { REF_CODE_RE, refCookie, refFromSearch } from './ref-cookie';

describe('refFromSearch', () => {
  it('accepts a well-formed code in any case and normalizes it', () => {
    expect(refFromSearch('?ref=ana-ab12cd')).toBe('ANA-AB12CD');
    expect(refFromSearch('?utm=x&ref=ANA-AB12CD')).toBe('ANA-AB12CD');
  });

  it.each(['', '?ref=', '?ref=ANA', '?ref=ANA-AB12C', '?ref=AN-AB12CD', '?ref=ANA-AB12CD;path=/', '?ref=<script>', '?foo=ANA-AB12CD'])(
    'ignores %j',
    (search) => {
      expect(refFromSearch(search)).toBeNull();
    },
  );
});

describe('refCookie', () => {
  it('lasts 30 days, is Lax and site-wide, and Secure on https', () => {
    expect(refCookie('ANA-AB12CD', true)).toBe('ref=ANA-AB12CD; Max-Age=2592000; Path=/; SameSite=Lax; Secure');
    expect(refCookie('ANA-AB12CD', false)).not.toContain('Secure');
  });
});

it('keeps the same code contract as the pricing package', () => {
  expect(REF_CODE_RE.source).toBe(AFFILIATE_CODE_RE.source);
});
