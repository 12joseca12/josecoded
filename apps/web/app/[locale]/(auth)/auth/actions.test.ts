// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  allowAttempt: vi.fn(async () => true),
  pendingEmail: 'ana@test.com' as string | undefined,
  rememberPendingEmail: vi.fn(async () => undefined),
  forgetPendingEmail: vi.fn(async () => undefined),
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
    auth: { signInWithOtp: mocks.signInWithOtp, verifyOtp: mocks.verifyOtp },
  }),
}));
vi.mock('@/lib/auth/rate-limit', () => ({ allowAttempt: mocks.allowAttempt }));
vi.mock('@/lib/auth/pending-email', () => ({
  readPendingEmail: async () => mocks.pendingEmail,
  rememberPendingEmail: mocks.rememberPendingEmail,
  forgetPendingEmail: mocks.forgetPendingEmail,
}));
vi.mock('@/lib/auth/after-sign-in', () => ({ afterSignIn: mocks.afterSignIn }));

import { requestOtp, verifyOtp } from './actions';

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
const idle = { status: 'idle' } as const;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookieRef = undefined;
  mocks.pendingEmail = 'ana@test.com';
  mocks.allowAttempt.mockResolvedValue(true);
  mocks.signInWithOtp.mockResolvedValue({ error: null });
});

describe('requestOtp', () => {
  const ok = { email: 'Ana@Test.com ', 'cf-turnstile-response': 'tok', locale: 'es', next: '/area-clientes/tareas' };

  it('rejects an invalid email without touching Supabase', async () => {
    const state = await requestOtp(idle, form({ ...ok, email: 'nope' }));
    expect(state).toEqual({ status: 'error', fieldErrors: { email: 'auth.errors.invalidEmail' } });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('rejects a missing CAPTCHA token', async () => {
    const state = await requestOtp(idle, form({ email: 'a@b.co', locale: 'es' }));
    expect(state).toMatchObject({ status: 'error', formError: 'auth.errors.captcha' });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('has a single CAPTCHA layer: the token goes to Supabase Auth, which verifies it', async () => {
    await expect(requestOtp(idle, form(ok))).rejects.toThrow('REDIRECT');
    expect(mocks.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ options: expect.objectContaining({ captchaToken: 'tok' }) }),
    );
  });

  it('shows the CAPTCHA message when Supabase refuses the token', async () => {
    mocks.signInWithOtp.mockResolvedValueOnce({ error: { code: 'captcha_failed', status: 400 } });
    expect(await requestOtp(idle, form(ok))).toMatchObject({ formError: 'auth.errors.captcha' });
    expect(mocks.rememberPendingEmail).not.toHaveBeenCalled();
  });

  it('sends the code for the normalized email and moves to the code screen', async () => {
    await expect(requestOtp(idle, form(ok))).rejects.toThrow('REDIRECT /auth/codigo?next=%2Farea-clientes%2Ftareas');
    expect(mocks.rememberPendingEmail).toHaveBeenCalledWith('ana@test.com'); // in a cookie, not in the URL
    expect(mocks.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@test.com', options: expect.objectContaining({ shouldCreateUser: true, data: { locale: 'es' } }) }),
    );
  });

  it('uses the English path for English and never carries an external next', async () => {
    await expect(requestOtp(idle, form({ ...ok, locale: 'en', next: 'https://evil.com' }))).rejects.toThrow(
      'REDIRECT /en/auth/code?next=%2Fen%2Fclient-area',
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
  const ok = { token: '123 456', locale: 'es', next: '/area-clientes' };

  it('rejects a code that is not six digits', async () => {
    const state = await verifyOtp(idle, form({ ...ok, token: '12345' }));
    expect(state).toMatchObject({ status: 'error', fieldErrors: { token: 'auth.errors.invalidCode' } });
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it('answers on the field when the pending-email cookie is gone', async () => {
    mocks.pendingEmail = undefined;
    expect(await verifyOtp(idle, form(ok))).toMatchObject({ fieldErrors: { token: 'auth.errors.invalidCode' } });
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it('rate limits by network and by email before asking Supabase', async () => {
    mocks.allowAttempt.mockResolvedValue(false);
    expect(await verifyOtp(idle, form(ok))).toMatchObject({ formError: 'auth.errors.rateLimited' });
    expect(mocks.allowAttempt).toHaveBeenCalledWith('otp', { ip: '203.0.113.9', subject: 'ana@test.com' });
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
    expect(mocks.forgetPendingEmail).toHaveBeenCalled();
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
