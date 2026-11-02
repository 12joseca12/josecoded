// The Resend adapter against a strict fetch mock (task 3.8b): the exact request, nothing else, and nothing sensitive in errors.
import { describe, expect, it, vi } from 'vitest';

import { createEmailSender } from './email';

import type { Env } from '../types/env.types';

const env = { API_MODE: 'development', CORS_ORIGINS: '', SUPABASE_URL: 'http://127.0.0.1:54321', RESEND_API_KEY: 're_test_0123456789' } satisfies Env;

function mock(status = 200) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify({ id: 'e1', message: 'rejected for ana@example.com' }), { status });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

describe('createEmailSender', () => {
  it('is absent without RESEND_API_KEY', () => {
    expect(createEmailSender({ ...env, RESEND_API_KEY: undefined })).toBeUndefined();
  });

  it('posts one rendered template to Resend with the bearer key and the idempotency key', async () => {
    const { calls, fetchImpl } = mock();
    await createEmailSender(env, fetchImpl)!.sendEmail({
      templateId: 'staff-invited',
      to: 'carla@example.com',
      locale: 'es',
      vars: { role: 'closer' },
      idempotencyKey: 'outbox-17',
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://api.resend.com/emails');
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer re_test_0123456789');
    expect(headers['idempotency-key']).toBe('outbox-17');
    const body = JSON.parse(String(calls[0]!.init.body)) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['from', 'html', 'subject', 'text', 'to']);
    expect(body.to).toEqual(['carla@example.com']);
    expect(body.from).toBe('josecoded.com <no-reply@josecoded.com>');
    expect(String(body.text)).toMatch(/closer/);
    expect(String(body.text)).toMatch(/autenticador/);
  });

  it('uses EMAIL_FROM when set', async () => {
    const { calls, fetchImpl } = mock();
    await createEmailSender({ ...env, EMAIL_FROM: 'Jose <jose@josecoded.com>' }, fetchImpl)!.sendEmail({ templateId: 'client-invited', to: 'a@b.co', locale: 'en' });
    expect(JSON.parse(String(calls[0]!.init.body))).toMatchObject({ from: 'Jose <jose@josecoded.com>' });
  });

  it('throws for a template outside the catalogue before any request', async () => {
    const { calls, fetchImpl } = mock();
    const sender = createEmailSender(env, fetchImpl)!;
    await expect(sender.sendEmail({ templateId: 'free-text' as never, to: 'a@b.co', locale: 'es' })).rejects.toThrow('unknown_email_template');
    expect(calls).toHaveLength(0);
  });

  it('refuses a recipient that is not an email, or several', async () => {
    const { calls, fetchImpl } = mock();
    const sender = createEmailSender(env, fetchImpl)!;
    for (const to of ['not-an-email', 'a@b.co, c@d.co', 'a@b.co\r\nBcc: x@y.co']) {
      await expect(sender.sendEmail({ templateId: 'client-invited', to, locale: 'es' })).rejects.toThrow('invalid_email_recipient');
    }
    expect(calls).toHaveLength(0);
  });

  it('errors name the status only: never the address or the body Resend echoes', async () => {
    const { fetchImpl } = mock(422);
    await expect(
      createEmailSender(env, fetchImpl)!.sendEmail({ templateId: 'client-invited', to: 'ana@example.com', locale: 'es' }),
    ).rejects.toThrow(/^resend 422$/);
  });

  it('a network error does not carry the key', async () => {
    const boom = vi.fn(async () => {
      throw new Error('connect failed to https://api.resend.com/emails with Bearer re_test_0123456789');
    }) as unknown as typeof fetch;
    await expect(
      createEmailSender(env, boom)!.sendEmail({ templateId: 'client-invited', to: 'a@b.co', locale: 'es' }),
    ).rejects.toThrow(/^resend network error$/);
  });
});
