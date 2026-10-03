import { describe, expect, it } from 'vitest';

import { isAllowedOrigin, parseOriginList } from './cors-origins';

const list =
  'https://josecoded.com,https://www.josecoded.com,https://*-josecoded-web.jose.workers.dev,http://localhost:3000';

describe('isAllowedOrigin with the production list (dash wildcard for previews)', () => {
  it.each([
    ['https://josecoded.com', true],
    ['https://www.josecoded.com', true],
    ['http://localhost:3000', true],
    // real previews: <hash>-<worker>.<sub>.workers.dev
    ['https://abc123-josecoded-web.jose.workers.dev', true],
    // any hash is a preview (they hold no production data), evil ones included
    ['https://evil-josecoded-web.jose.workers.dev', true],
    // without a hash there is no dash prefix: it is the production Worker, not a preview
    ['https://josecoded-web.jose.workers.dev', false],
    // a dot is not a dash
    ['https://x.jose.workers.dev', false],
    ['https://abc.josecoded-web.jose.workers.dev', false],
    // suffix tricks
    ['https://abc-josecoded-web.jose.workers.dev.evil.com', false],
    ['https://josecoded.com.evil.com', false],
    ['https://evilJosecoded.com', false],
    ['https://evil.com', false],
    ['https://x.workers.dev', false],
    // the prefix is [a-z0-9]+: no empty, no dashes inside, no uppercase, no dots, no userinfo
    ['https://-josecoded-web.jose.workers.dev', false],
    ['https://a-b-josecoded-web.jose.workers.dev', false],
    ['https://ABC-josecoded-web.jose.workers.dev', false],
    ['https://a.b-josecoded-web.jose.workers.dev', false],
    ['https://evil.com@abc-josecoded-web.jose.workers.dev', false],
    // scheme, port and path are part of the origin
    ['http://abc-josecoded-web.jose.workers.dev', false],
    ['https://abc-josecoded-web.jose.workers.dev:8443', false],
    ['https://abc-josecoded-web.jose.workers.dev/', false],
    ['http://localhost:3001', false],
    ['', false],
  ])('%s -> %s', (origin, expected) => {
    expect(isAllowedOrigin(origin, list)).toBe(expected);
  });
});

describe('isAllowedOrigin with a dot wildcard (https://*.host)', () => {
  const dots = 'https://*.josecoded.com';

  it.each([
    ['https://app.josecoded.com', true],
    ['https://a.b.josecoded.com', true],
    ['https://josecoded.com', false],
    ['https://eviljosecoded.com', false],
    ['https://app.josecoded.com.evil.com', false],
    ['https://.josecoded.com', false],
    ['https://app..josecoded.com', false],
  ])('%s -> %s', (origin, expected) => {
    expect(isAllowedOrigin(origin, dots)).toBe(expected);
  });
});

describe('list handling', () => {
  it('trims entries and ignores empty ones', () => {
    expect(parseOriginList(' https://a.com , ,https://b.com,')).toEqual(['https://a.com', 'https://b.com']);
    expect(isAllowedOrigin('https://b.com', ' https://a.com , https://b.com ')).toBe(true);
  });

  it('an empty list allows nothing', () => {
    expect(isAllowedOrigin('https://josecoded.com', '')).toBe(false);
  });

  it('regex characters in an entry are literal', () => {
    expect(isAllowedOrigin('https://abc-josecodedXweb.jose.workers.dev', 'https://*-josecoded.web.jose.workers.dev')).toBe(
      false,
    );
  });
});
