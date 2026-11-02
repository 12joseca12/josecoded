// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verify: vi.fn(async () => true),
  postLead: vi.fn(async () => ({ status: 'ok', leadId: 'x' }) as { status: string; leadId?: string }),
  cookieRef: undefined as string | undefined,
}));

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'cf-connecting-ip': '203.0.113.9' }),
  cookies: async () => ({ get: (name: string) => (name === 'ref' && mocks.cookieRef ? { value: mocks.cookieRef } : undefined) }),
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}`,
}));
vi.mock('@/lib/turnstile/verify', () => ({ verifyTurnstileToken: mocks.verify }));
vi.mock('@/lib/leads/post', () => ({ postLead: mocks.postLead }));

import { submitContact } from './actions';

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ kind: 'contact', locale: 'es', name: 'Marta', email: 'Marta@Example.com', message: 'Una web', 'cf-turnstile-response': 'tok', ...fields })) {
    data.set(key, value);
  }
  return data;
};

beforeEach(() => {
  mocks.verify.mockClear().mockResolvedValue(true);
  mocks.postLead.mockClear().mockResolvedValue({ status: 'ok', leadId: 'x' });
  mocks.cookieRef = undefined;
});

describe('submitContact', () => {
  it('verifies the token with the contact action and sends a web_form lead with a UUID key and the locale', async () => {
    const answer = await submitContact({ status: 'idle' }, form({ via: 'client', idempotencyKey: 'b7a1e0a0-3b0d-4b1c-9d3e-1c2d3e4f5a6b' }));
    expect(answer).toEqual({ status: 'ok' });
    expect(mocks.verify).toHaveBeenCalledWith('tok', { ip: '203.0.113.9', action: 'contact' });
    expect(mocks.postLead).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'web_form',
        locale: 'es',
        idempotencyKey: 'b7a1e0a0-3b0d-4b1c-9d3e-1c2d3e4f5a6b',
        contact: { name: 'Marta', email: 'marta@example.com' },
      }),
    );
  });

  it('makes a key when the browser sent none or a bad one, and passes the referral code', async () => {
    mocks.cookieRef = 'ABC-123456';
    await submitContact({ status: 'idle' }, form({ idempotencyKey: 'nope' }));
    const body = (mocks.postLead.mock.calls as unknown as unknown[][])[0]?.[0] as { idempotencyKey: string; affiliateCode?: string };
    expect(body.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.affiliateCode).toBe('ABC-123456');
  });

  it('sends the agency form as partner_form with its company and the partner Turnstile action', async () => {
    await submitContact({ status: 'idle' }, form({ kind: 'partner', company: 'Agencia X' }));
    expect(mocks.verify).toHaveBeenCalledWith('tok', { ip: '203.0.113.9', action: 'partner' });
    expect(mocks.postLead).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'partner_form', contact: expect.objectContaining({ company: 'Agencia X' }) }),
    );
  });

  it('answers field errors without calling the gateway', async () => {
    const answer = await submitContact({ status: 'idle' }, form({ email: 'no', name: '' }));
    expect(answer).toEqual({ status: 'error', fieldErrors: { name: 'contact.errors.name', email: 'contact.errors.email' } });
    expect(mocks.postLead).not.toHaveBeenCalled();
  });

  it('refuses a token that does not verify and never reaches the gateway', async () => {
    mocks.verify.mockResolvedValue(false);
    const answer = await submitContact({ status: 'idle' }, form({}));
    expect(answer).toEqual({ status: 'error', formError: 'contact.errors.captcha' });
    expect(mocks.postLead).not.toHaveBeenCalled();
  });

  it('offers the fallback when the gateway is down, and a plain error when it rejects the data', async () => {
    mocks.postLead.mockResolvedValue({ status: 'down' });
    expect(await submitContact({ status: 'idle' }, form({}))).toEqual({ status: 'error', formError: 'contact.errors.down', fallback: true });
    mocks.postLead.mockResolvedValue({ status: 'invalid' });
    expect(await submitContact({ status: 'idle' }, form({}))).toEqual({ status: 'error', formError: 'contact.errors.generic' });
  });
});
