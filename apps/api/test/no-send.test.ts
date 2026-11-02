import { describe, expect, it, vi } from 'vitest';

import { createEmailSender } from '../src/adapters/email';
import { EMAIL_TEMPLATE_IDS } from '../src/templates';

// Plan 3.8b: the gateway may send email only from the catalogue of fixed templates (DATOS Q5). The workerd tests have no
// filesystem, so Vite inlines the sources as text.
const sources = import.meta.glob<string>(['../src/**/*.ts', '!../src/**/*.test.ts', '../../../packages/types/src/**/*.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('no free-body email (task 3.8b)', () => {
  it('the EmailSender port takes a template id, an address, a locale and enum variables, and nothing else', () => {
    const api = Object.entries(sources).find(([path]) => path.endsWith('packages/types/src/api.ts'))?.[1] ?? '';
    const block = /export interface EmailSender \{([\s\S]*?)\n\}/.exec(api)?.[1] ?? '';
    const fields = [...block.matchAll(/^\s{4}(\w+)\??:/gm)].map((m) => m[1]);
    expect(fields).toEqual(['templateId', 'to', 'locale', 'vars', 'idempotencyKey']);
    expect(block).not.toMatch(/\b(body|html|text|subject|content)\??:/);
  });

  it('only the Resend adapter talks to an email provider', () => {
    const offenders = Object.entries(sources)
      .filter(([path, text]) => /api\.resend\.com|smtp\.|nodemailer|sendgrid|mailgun|postmark/i.test(text) && !path.endsWith('src/adapters/email.ts'))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it('no source calls sendEmail with a subject or a body of its own', () => {
    const offenders = Object.entries(sources)
      .filter(([, text]) => /sendEmail\(\s*\{[^}]*\b(subject|html|text|body)\s*:/s.test(text))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it('the catalogue is the three templates', () => {
    expect(EMAIL_TEMPLATE_IDS).toHaveLength(3);
  });

  it('extra fields handed to the adapter never reach the request: the message is always the template', async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
      calls.push(String(init?.body));
      return new Response('{}', { status: 200 });
    }) as unknown as typeof fetch;
    const sender = createEmailSender(
      { API_MODE: 'development', CORS_ORIGINS: '', SUPABASE_URL: 'http://x.test', RESEND_API_KEY: 're_test_0123456789' },
      fetchImpl,
    )!;
    await sender.sendEmail({
      templateId: 'client-invited',
      to: 'ana@example.com',
      locale: 'es',
      html: '<p>buy now</p>',
      text: 'buy now',
      subject: 'buy now',
      body: 'buy now',
    } as never);
    expect(calls).toHaveLength(1);
    expect(calls[0]).not.toContain('buy now');
    expect(JSON.parse(calls[0]!)).toMatchObject({ subject: 'Tu área de cliente en josecoded.com' });
  });
});
