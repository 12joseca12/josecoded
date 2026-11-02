// The catalogue of fixed emails (task 3.8b). `renderEmail` is the only way a subject or a body is produced: the id must be
// listed here and the variables must pass the template's zod schema (enums only), or it throws.
import { z } from 'zod';

import { clientInvitedEn } from './client-invited.en';
import { clientInvitedEs } from './client-invited.es';
import { staffInvitedEn } from './staff-invited.en';
import { staffInvitedEs } from './staff-invited.es';
import { storyDecidedEn } from './story-decided.en';
import { storyDecidedEs } from './story-decided.es';
import { render, type EmailTemplate, type Locale, type RenderedEmail } from './types';

import type { EmailTemplateId } from '@josecoded/types';

type Entry<V> = { vars: z.ZodType<V>; es: EmailTemplate<V>; en: EmailTemplate<V> };

const entry = <V>(vars: z.ZodType<V>, es: EmailTemplate<V>, en: EmailTemplate<V>): Entry<V> => ({ vars, es, en });

const CATALOGUE: Record<EmailTemplateId, Entry<never>> = {
  'staff-invited': entry(z.object({ role: z.enum(['admin', 'closer']) }).strict(), staffInvitedEs, staffInvitedEn),
  'client-invited': entry(z.object({}).strict() as z.ZodType<Record<string, never>>, clientInvitedEs, clientInvitedEn),
  'story-decided': entry(z.object({ status: z.enum(['accepted', 'rejected', 'converted']) }).strict(), storyDecidedEs, storyDecidedEn),
} as unknown as Record<EmailTemplateId, Entry<never>>;

export const EMAIL_TEMPLATE_IDS = Object.keys(CATALOGUE) as EmailTemplateId[];

export function isEmailTemplateId(value: unknown): value is EmailTemplateId {
  return typeof value === 'string' && Object.hasOwn(CATALOGUE, value);
}

export function renderEmail(templateId: string, locale: Locale, vars: Record<string, string> = {}): RenderedEmail {
  if (!isEmailTemplateId(templateId)) throw new Error('unknown_email_template');
  const template = CATALOGUE[templateId] as unknown as Entry<unknown>;
  const parsed = template.vars.safeParse(vars);
  if (!parsed.success) throw new Error('invalid_email_variables');
  return render(template[locale], locale, parsed.data);
}
