'use server';

import { cookies, headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { localeSchema } from '@josecoded/types';

import { REF_CODE_RE, REF_COOKIE } from '@/lib/area/ref-cookie';
import { postLead } from '@/lib/leads/post';
import { verifyTurnstileToken } from '@/lib/turnstile/verify';

import type { FormState, Locale } from '@josecoded/types';

// Last step of the guided proposal: the visitor sends the proposal they were shown. The signed
// `proposalToken` from the gateway travels with the lead; the gateway verifies it and prices the lead
// again, so nothing the browser says about the price is stored. Turnstile is verified here (action
// `proposal_send`) and the lead goes with the server key, like the contact form.

export type SendProposalFields = { name: string; email: string; phone: string };
export type SendProposalState = FormState<SendProposalFields> & { fallback?: boolean; pack?: string; hasRef?: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sendSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(320),
  phone: z
    .string()
    .trim()
    .max(32)
    .regex(/^([+\d][\d\s().-]*)?$/)
    .optional(),
  proposalToken: z.string().min(20).max(6000),
  turnstileToken: z.string().min(1).max(2048),
});

const str = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === 'string' ? value : undefined;
};

export async function sendProposal(_previous: SendProposalState, data: FormData): Promise<SendProposalState> {
  const parsedLocale = localeSchema.safeParse(str(data, 'locale'));
  const locale: Locale = parsedLocale.success ? parsedLocale.data : 'es';
  const t = await getTranslations({ locale, namespace: 'proposal.send.errors' });

  // handed back on every error so the form keeps what the visitor typed (WCAG 3.3.7); never the token
  const values: NonNullable<SendProposalState['values']> = {
    name: str(data, 'name') ?? '',
    email: str(data, 'email') ?? '',
    phone: str(data, 'phone') ?? '',
  };

  const parsed = sendSchema.safeParse({
    name: str(data, 'name'),
    email: str(data, 'email')?.trim().toLowerCase(),
    phone: str(data, 'phone') || undefined,
    proposalToken: str(data, 'proposalToken'),
    turnstileToken: str(data, 'cf-turnstile-response'),
  });
  if (!parsed.success) {
    const fieldErrors: SendProposalState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'name' || field === 'email' || field === 'phone') fieldErrors[field] = t(field);
    }
    if (Object.keys(fieldErrors).length > 0) return { status: 'error', fieldErrors, values };
    const token = parsed.error.issues.some((issue) => issue.path[0] === 'proposalToken');
    return { status: 'error', formError: token ? t('expired') : t('captcha'), values };
  }

  const input = parsed.data;
  const ip = (await headers()).get('cf-connecting-ip');
  if (!(await verifyTurnstileToken(input.turnstileToken, { ip, action: 'proposal_send' }))) {
    return { status: 'error', formError: t('captcha'), values };
  }

  const sentKey = str(data, 'idempotencyKey') ?? '';
  const ref = (await cookies()).get(REF_COOKIE)?.value;
  const hasRef = Boolean(ref && REF_CODE_RE.test(ref));
  const result = await postLead({
    source: 'web_proposal',
    locale,
    idempotencyKey: UUID.test(sentKey) ? sentKey : crypto.randomUUID(),
    contact: { name: input.name, email: input.email, ...(input.phone ? { phone: input.phone } : {}) },
    proposalToken: input.proposalToken,
    ...(hasRef && ref ? { affiliateCode: ref } : {}),
    meta: { path: '/propuesta' },
  }, { clientIp: ip });

  if (result.status === 'ok') return { status: 'ok', pack: str(data, 'pack') ?? '', hasRef };
  if (result.status === 'invalid') return { status: 'error', formError: t('expired'), values };
  return { status: 'error', formError: t('down'), fallback: true, values };
}
