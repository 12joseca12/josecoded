import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { STATIC_SECURITY_HEADERS } from './headers';

describe('static security headers', () => {
  it('cover HSTS, nosniff, referrer, permissions and COOP, and nothing is preloaded', () => {
    const byKey = Object.fromEntries(STATIC_SECURITY_HEADERS.map(({ key, value }) => [key, value]));
    expect(byKey['Strict-Transport-Security']).toMatch(/^max-age=\d{8,}; includeSubDomains$/);
    expect(byKey['X-Content-Type-Options']).toBe('nosniff');
    expect(byKey['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(byKey['Permissions-Policy']).toContain('camera=()');
    expect(byKey['Cross-Origin-Opener-Policy']).toBe('same-origin');
  });

  it('public/_headers (served by the assets binding) says the same', () => {
    const file = readFileSync(join(process.cwd(), 'public', '_headers'), 'utf8');
    const lines = file.split('\n').filter((line) => /^\s+\S+: /.test(line)).map((line) => line.trim());
    expect(lines).toEqual(STATIC_SECURITY_HEADERS.map(({ key, value }) => `${key}: ${value}`));
  });
});
