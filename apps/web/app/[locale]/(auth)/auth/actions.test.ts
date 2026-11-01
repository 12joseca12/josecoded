// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  signInWithOAuth: vi.fn(),
  verifyTurnstile: vi.fn(),
  afterSignIn: vi.fn(async () => undefined),
  cookieRef: undefined as string | undefined,
}));

vi.mock('next/navigation', async (importActual) => ({
  ...(await importActual<typeof import('next/navigation')>()),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'cf-connecting-ip': '203.0.113.9' }),
  cookies: async () => ({ get: (name: string) => (name === 'ref' && mocks.cookieRef ? { value: mocks.cookieRef } : undefined) }),
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}`,
}));
vi.mock('@/lib/env', () => ({ env: { client: { NEXT_PUBLIC_SITE_URL: 'https://josecoded.com' } } }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: async () => ({
    auth: { signInWithOtp: mocks.signInWithOtp, verifyOtp: mocks.verifyOtp, signInWithOAuth: mocks.signInWithOAuth },
  }),
}));
vi.mock('@/lib/turnstile/verify', () => ({ verifyTurnstileToken: mocks.verifyTurnstile }));
vi.mock('@/lib/auth/after-sign-in', () => ({ afterSignIn: mocks.afterSignIn }));

import { requestOtp, signInWithProvider, verifyOtp } from './actions';

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
const idle = { status: 'idle' } as const;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookieRef = undefined;
  mocks.verifyTurnstile.mockResolvedValue(true);
  mocks.signInWithOtp.mockResolvedValue({ error: null });
});

describe('requestOtp', () => {
  const ok = { email: 'Ana@Test.com ', 'cf-turnstile-response': 'tok', locale: 'es', next: '/area-clientes/tareas' };

  it('rejects an invalid email without touching Cloudflare or Supabase', async () => {
    const state = await requestOtp(idle, form({ ...ok, email: 'nope' }));
    expect(state).toEqual({ status: 'error', fieldErrors: { email: 'auth.errors.invalidEmail' } });
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('rejects a missing CAPTCHA token', async () => {
    const state = await requestOtp(idle, form({ email: 'a@b.co', locale: 'es' }));
    expect(state).toMatchObject({ status: 'error', formError: 'auth.errors.captcha' });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('fails closed when Cloudflare refuses the token, and verifies it for the login action with the client IP', async () => {
    mocks.verifyTurnstile.mockResolvedValue(false);
    expect(await requestOtp(idle, form(ok))).toMatchObject({ formError: 'auth.errors.captcha' });
    expect(mocks.verifyTurnstile).toHaveBeenCalledWith('tok', { ip: '203.0.113.9', action: 'login' });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('sends the code for the normalized email and moves to the code screen', async () => {
    await expect(requestOtp(idle, form(ok))).rejects.toThrow(
      'REDIRECT /auth/codigo?email=ana%40test.com&next=%2Farea-clientes%2Ftareas',
    );
    expect(mocks.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@test.com', options: expect.objectContaining({ shouldCreateUser: true, data: { locale: 'es' } }) }),
    );
  });

  it('uses the English path for English and never carries an external next', async () => {
    await expect(requestOtp(idle, form({ ...ok, locale: 'en', next: 'https://evil.com' }))).rejects.toThrow(
      'REDIRECT /en/auth/code?email=ana%40test.com&next=%2Fen%2Fclient-area',
    );
  });

  it('maps a Supabase rate limit and any other error to friendly messages', async () => {
    mocks.signInWithOtp.mockResolvedValueOnce({ error: { code: 'over_email_send_rate_limit', status: 429 } });
    expect(await requestOtp(idle, form(ok))).toMatchObject({ formError: 'auth.errors.rateLimited' });
    mocks.signInWithOtp.mockResolvedValueOnce({ error: { status: 500 } });
    expect(await requestOtp(idle, form(ok))).toMatchObject({ formError: 'auth.errors.generic' });
  });
});

describe('verifyOtp', () => {
  const ok = { email: 'ana@test.com', token: '123 456', locale: 'es', next: '/area-clientes' };

  it('rejects a code that is not six digits', async () => {
    const state = await verifyOtp(idle, form({ ...ok, token: '12345' }));
    expect(state).toMatchObject({ status: 'error', fieldErrors: { token: 'auth.errors.invalidCode' } });
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it('answers a wrong or expired code on the field', async () => {
    mocks.verifyOtp.mockResolvedValue({ data: { user: null }, error: { status: 403 } });
    expect(await verifyOtp(idle, form(ok))).toMatchObject({ fieldErrors: { token: 'auth.errors.invalidCode' } });
    expect(mocks.afterSignIn).not.toHaveBeenCalled();
  });

  it('starts the session, records the signals and lands on next', async () => {
    mocks.cookieRef = 'ANA-TEST01';
    mocks.verifyOtp.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    await expect(verifyOtp(idle, form({ ...ok, audience: 'blog' }))).rejects.toThrow('REDIRECT /area-clientes');
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ email: 'ana@test.com', token: '123456', type: 'email' });
    expect(mocks.afterSignIn).toHaveBeenCalledWith(expect.anything(), { id: 'u1' }, { ref: 'ANA-TEST01', audience: 'blog' });
  });

  it('never redirects outside the site', async () => {
    mocks.verifyOtp.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    await expect(verifyOtp(idle, form({ ...ok, next: '//evil.com' }))).rejects.toThrow('REDIRECT /area-clientes');
  });

  it('drops an audience that is not one of the three allowed', async () => {
    mocks.verifyOtp.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    await expect(verifyOtp(idle, form({ ...ok, audience: 'admin' }))).rejects.toThrow('REDIRECT');
    expect(mocks.afterSignIn).toHaveBeenCalledWith(expect.anything(), expect.anything(), { ref: undefined, audience: undefined });
  });
});

describe('signInWithProvider', () => {
  it('accepts only google and github', async () => {
    await expect(signInWithProvider(form({ provider: 'facebook', locale: 'es' }))).rejects.toThrow(
      'REDIRECT /auth/login?error=callback',
    );
    expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
  });

  it('asks for the provider URL with a callback on our own origin and a safe next', async () => {
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: 'https://accounts.google.com/o/oauth2/x' }, error: null });
    await expect(
      signInWithProvider(form({ provider: 'google', locale: 'en', next: 'https://evil.com' })),
    ).rejects.toThrow('REDIRECT https://accounts.google.com/o/oauth2/x');
    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://josecoded.com/en/auth/callback?next=%2Fen%2Fclient-area' },
    });
  });
});
