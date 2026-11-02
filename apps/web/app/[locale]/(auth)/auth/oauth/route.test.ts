// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ signInWithOAuth: vi.fn() }));
vi.mock('@/lib/env', () => ({ env: { client: { NEXT_PUBLIC_SITE_URL: 'https://josecoded.com' } } }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: async () => ({ auth: { signInWithOAuth: mocks.signInWithOAuth } }),
}));

import { GET } from './route';

const call = (query: string, locale = 'es') =>
  GET(new Request(`https://josecoded.com/auth/oauth?${query}`) as never, { params: Promise.resolve({ locale }) });

beforeEach(() => vi.clearAllMocks());

describe('GET /auth/oauth', () => {
  it('accepts only google and github', async () => {
    const res = await call('provider=facebook');
    expect(res.headers.get('location')).toBe('https://josecoded.com/auth/login?error=callback');
    expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
  });

  it('redirects to the provider with a callback on our origin and a safe next', async () => {
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: 'https://accounts.google.com/o/oauth2/x' }, error: null });
    const res = await call('provider=google&next=https%3A%2F%2Fevil.com', 'en');
    expect(res.headers.get('location')).toBe('https://accounts.google.com/o/oauth2/x');
    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://josecoded.com/en/auth/callback?next=%2Fen%2Fclient-area',
        skipBrowserRedirect: true,
      },
    });
  });

  it('falls back to the login when Supabase fails', async () => {
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: { status: 500 } });
    expect((await call('provider=github')).headers.get('location')).toContain('/auth/login?error=callback');
  });
});
