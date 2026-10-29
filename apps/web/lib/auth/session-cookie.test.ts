import { describe, expect, it } from 'vitest';

import { hasSessionCookie } from './session-cookie';

describe('hasSessionCookie', () => {
  it('detects the Supabase auth cookie, whole or chunked', () => {
    expect(hasSessionCookie('a=1; sb-echlwywbucgbhwpncviy-auth-token=base64-x; b=2')).toBe(true);
    expect(hasSessionCookie('sb-abc-auth-token.0=x')).toBe(true);
  });

  it('ignores anything else, including the code verifier and empty jars', () => {
    expect(hasSessionCookie('')).toBe(false);
    expect(hasSessionCookie('theme=dark; sb-abc-auth-token-code-verifier=x')).toBe(false);
    expect(hasSessionCookie('xsb-abc-auth-token=1')).toBe(false);
  });
});
