'use server';

import { cookies, headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import { localeSchema } from '@josecoded/types';

import { REF_CODE_RE, REF_COOKIE } from '@/lib/area/ref-cookie';
import { postLead } from '@/lib/leads/post';
import { leadFormSchema } from '@/lib/leads/schema';
import { verifyTurnstileToken } from '@/lib/turnstile/verify';

import type { LeadFormFields } from '@/lib/leads/schema';
import type { FormState, Locale } from '@josecoded/types';

// Server Action of the contact form and of the agency form (plan 3.10, 3.3). Nothing from the browser is
// trusted: the fields are parsed with zod, the Turnstile token is verified here (single use, with the
// action of the widget) and only then the lead goes to the gateway with the server key. `fallback`
// tells the form that the gateway is down, so it offers email and WhatsApp instead of a dead end.

export type LeadFormState = FormState<LeadFormFields> & { fallback?: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const str = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === 'string' ? value : undefined;
};

function localeOf(data: FormData): Locale {
  const parsed = localeSchema.safeParse(str(data, 'locale'));
  return parsed.success ? parsed.data : 'es';
}

export async function submitContact(_previous: LeadFormState, data: FormData): Promise<LeadFormState> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'contact.errors' });

  // handed back on every error so the form keeps what the visitor typed (WCAG 3.3.7); never the token
  const values: NonNullable<LeadFormState['values']> = {
    name: str(data, 'name') ?? '',
    email: str(data, 'email') ?? '',
    company: str(data, 'company') ?? '',
    message: str(data, 'message') ?? '',
  };

  const parsed = leadFormSchema.safeParse({
    kind: str(data, 'kind'),
    locale,
    name: str(data, 'name'),
    email: str(data, 'email')?.trim().toLowerCase(),
    company: str(data, 'company') || undefined,
    message: str(data, 'message'),
    via: str(data, 'via') || undefined,
    turnstileToken: str(data, 'cf-turnstile-response'),
  });
  if (!parsed.success) {
    const fieldErrors: LeadFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'name' || field === 'email' || field === 'message' || field === 'company') {
        fieldErrors[field] = t(field);
      }
    }
    const captchaMissing = parsed.error.issues.some((issue) => issue.path[0] === 'turnstileToken');
    if (Object.keys(fieldErrors).length > 0) return { status: 'error', fieldErrors, values };
    return { status: 'error', formError: captchaMissing ? t('captcha') : t('generic'), values };
  }

  const input = parsed.data;
  const ip = (await headers()).get('cf-connecting-ip');
  const verified = await verifyTurnstileToken(input.turnstileToken, {
    ip,
    action: input.kind === 'partner' ? 'partner' : 'contact',
  });
  if (!verified) return { status: 'error', formError: t('captcha'), values };

  const sentKey = str(data, 'idempotencyKey') ?? '';
  const ref = (await cookies()).get(REF_COOKIE)?.value;

  const result = await postLead({
    source: input.kind === 'partner' ? 'partner_form' : 'web_form',
    locale,
    idempotencyKey: UUID.test(sentKey) ? sentKey : crypto.randomUUID(),
    contact: { name: input.name, email: input.email, ...(input.company ? { company: input.company } : {}) },
    message: input.message,
    ...(ref && REF_CODE_RE.test(ref) ? { affiliateCode: ref } : {}),
    meta: { path: input.kind === 'partner' ? '/partners' : `/contacto${input.via ? `?via=${input.via}` : ''}` },
  }, { clientIp: ip });

  if (result.status === 'ok') return { status: 'ok' };
  if (result.status === 'invalid') return { status: 'error', formError: t('generic'), values };
  return { status: 'error', formError: t('down'), fallback: true, values };
}
