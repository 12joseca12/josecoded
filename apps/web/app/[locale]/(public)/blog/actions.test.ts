// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verify: vi.fn(async () => true),
  postLead: vi.fn(async () => ({ status: 'ok', leadId: 'x' }) as { status: string; leadId?: string }),
}));

vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'cf-connecting-ip': '203.0.113.9' }) }));
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}`,
}));
vi.mock('@/lib/turnstile/verify', () => ({ verifyTurnstileToken: mocks.verify }));
vi.mock('@/lib/leads/post', () => ({ postLead: mocks.postLead }));

import { subscribeToGuides } from './actions';

const KEY = 'b7a1e0a0-3b0d-4b1c-9d3e-1c2d3e4f5a6b';
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ locale: 'es', email: 'Marta@Example.com ', 'cf-turnstile-response': 'tok', idempotencyKey: KEY, ...fields })) {
    data.set(key, value);
  }
  return data;
};
const idle = { status: 'idle' } as const;

beforeEach(() => {
  mocks.verify.mockClear().mockResolvedValue(true);
  mocks.postLead.mockClear().mockResolvedValue({ status: 'ok', leadId: 'x' });
});

describe('subscribeToGuides', () => {
  it('verifies the notify action and sends a web_notify lead with only the email', async () => {
    expect(await subscribeToGuides(idle, form({}))).toEqual({ status: 'ok' });
    expect(mocks.verify).toHaveBeenCalledWith('tok', { ip: '203.0.113.9', action: 'notify' });
    expect(mocks.postLead).toHaveBeenCalledWith(
      { source: 'web_notify', locale: 'es', idempotencyKey: KEY, contact: { name: 'marta@example.com', email: 'marta@example.com' }, meta: { path: '/blog' } },
      { clientIp: '203.0.113.9' },
    );
  });

  it('makes a key when the browser sent none, and keeps the language', async () => {
    await subscribeToGuides(idle, form({ idempotencyKey: 'nope', locale: 'en' }));
    const body = (mocks.postLead.mock.calls as unknown as unknown[][])[0]?.[0] as { idempotencyKey: string; locale: string };
    expect(body.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.locale).toBe('en');
  });

  it('an invalid email is a field error, with what was typed handed back, and nothing is sent', async () => {
    const answer = await subscribeToGuides(idle, form({ email: 'no-es-un-correo' }));
    expect(answer).toEqual({ status: 'error', fieldErrors: { email: 'blog.article.notify.errors.email' }, values: { email: 'no-es-un-correo' } });
    expect(mocks.postLead).not.toHaveBeenCalled();
  });

  it('a missing or rejected Turnstile token sends nothing', async () => {
    const missing = await subscribeToGuides(idle, form({ 'cf-turnstile-response': '' }));
    expect(missing).toMatchObject({ status: 'error', formError: 'blog.article.notify.errors.captcha' });
    mocks.verify.mockResolvedValue(false);
    expect(await subscribeToGuides(idle, form({}))).toMatchObject({ status: 'error', formError: 'blog.article.notify.errors.captcha' });
    expect(mocks.postLead).not.toHaveBeenCalled();
  });

  it('tells a refused lead from a gateway that is down', async () => {
    mocks.postLead.mockResolvedValue({ status: 'invalid' });
    expect(await subscribeToGuides(idle, form({}))).toMatchObject({ formError: 'blog.article.notify.errors.generic' });
    mocks.postLead.mockResolvedValue({ status: 'down' });
    expect(await subscribeToGuides(idle, form({}))).toMatchObject({ formError: 'blog.article.notify.errors.down' });
  });
});
