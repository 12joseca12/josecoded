import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({ env: { client: { NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' } } }));

import { supabaseCookieOptions } from './cookie-options';

describe('supabaseCookieOptions', () => {
  it('is Secure only on an https site, always Lax and site-wide', () => {
    expect(supabaseCookieOptions('https://josecoded.com')).toEqual({ path: '/', sameSite: 'lax', secure: true });
    expect(supabaseCookieOptions('http://localhost:3000')).toEqual({ path: '/', sameSite: 'lax', secure: false });
    expect(supabaseCookieOptions()).toMatchObject({ secure: false });
  });
});
