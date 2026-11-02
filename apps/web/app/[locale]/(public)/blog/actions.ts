'use server';

import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { localeSchema } from '@josecoded/types';

import { postLead } from '@/lib/leads/post';
import { verifyTurnstileToken } from '@/lib/turnstile/verify';

import type { FormState } from '@josecoded/types';

// Server Action of «Avísame de nuevas guías» (block B06, plan 4.2): an email and nothing else. Like the contact form,
// nothing from the browser is trusted: zod first, then the Turnstile token (action `notify`), then the lead goes to
// the gateway with the server key as `source: 'web_notify'`. The CRM keeps it as a contact tagged newsletter_interest;
// there is no mailing list and no double opt-in (D44).

export type NotifyState = FormState<{ email: string }>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const notifySchema = z.object({
  locale: localeSchema,
  email: z.email().max(320),
  turnstileToken: z.string().min(1).max(2048),
});

const str = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === 'string' ? value : undefined;
};

export async function subscribeToGuides(_previous: NotifyState, data: FormData): Promise<NotifyState> {
  const locale = localeSchema.safeParse(str(data, 'locale')).data ?? 'es';
  const t = await getTranslations({ locale, namespace: 'blog.article.notify.errors' });
  const values = { email: str(data, 'email') ?? '' };

  const parsed = notifySchema.safeParse({
    locale,
    email: str(data, 'email')?.trim().toLowerCase(),
    turnstileToken: str(data, 'cf-turnstile-response'),
  });
  if (!parsed.success) {
    const field = parsed.error.issues.find((issue) => issue.path[0] === 'email');
    if (field) return { status: 'error', fieldErrors: { email: t('email') }, values };
    return { status: 'error', formError: t('captcha'), values };
  }

  const { email, turnstileToken } = parsed.data;
  const ip = (await headers()).get('cf-connecting-ip');
  if (!(await verifyTurnstileToken(turnstileToken, { ip, action: 'notify' }))) return { status: 'error', formError: t('captcha'), values };

  const sentKey = str(data, 'idempotencyKey') ?? '';
  const result = await postLead(
    {
      source: 'web_notify',
      locale,
      idempotencyKey: UUID.test(sentKey) ? sentKey : crypto.randomUUID(),
      // the contact has no name: the email stands in for it, as in the CRM list
      contact: { name: email, email },
      meta: { path: '/blog' },
    },
    { clientIp: ip },
  );

  if (result.status === 'ok') return { status: 'ok' };
  if (result.status === 'invalid') return { status: 'error', formError: t('generic'), values };
  return { status: 'error', formError: t('down'), values };
}
