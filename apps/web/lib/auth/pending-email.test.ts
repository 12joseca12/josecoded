// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => store }));
vi.mock('@/lib/env', () => ({ env: { client: { NEXT_PUBLIC_SITE_URL: 'https://josecoded.com' } } }));

import { forgetPendingEmail, PENDING_EMAIL_COOKIE, readPendingEmail, rememberPendingEmail } from './pending-email';

beforeEach(() => vi.clearAllMocks());

describe('pending email cookie', () => {
  it('is httpOnly, Lax, Secure on https and expires with the code', async () => {
    await rememberPendingEmail('ana@test.com');
    expect(store.set).toHaveBeenCalledWith(PENDING_EMAIL_COOKIE, 'ana@test.com', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 600,
    });
  });

  it('reads back only a valid email', async () => {
    store.get.mockReturnValueOnce({ value: 'ana@test.com' });
    expect(await readPendingEmail()).toBe('ana@test.com');
    store.get.mockReturnValueOnce({ value: 'not-an-email' });
    expect(await readPendingEmail()).toBeUndefined();
    store.get.mockReturnValueOnce(undefined);
    expect(await readPendingEmail()).toBeUndefined();
  });

  it('forgets it', async () => {
    await forgetPendingEmail();
    expect(store.delete).toHaveBeenCalledWith(PENDING_EMAIL_COOKIE);
  });
});
