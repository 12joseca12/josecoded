import { z } from 'zod';

import { cleanText, turnstileTokenSchema } from './text.ts';

// Gateway contract of POST /api/v1/leads and GET /api/v1/affiliates/validate (plan 3.8, DATOS §4.3). The route turns a
// valid body into the `p` of `create_lead(p jsonb)` (see createLeadInputSchema in crm.ts); nothing from `meta` is
// stored as the client sent it.

/** Sources a visitor or the web can claim. `chat` is written by the assistant, `manual`/`referral` by the admin. */
export const PUBLIC_LEAD_SOURCES = ['web_form', 'web_proposal', 'calcom', 'partner_form', 'web_notify'] as const;

const phone = z
  .string()
  .trim()
  .min(6)
  .max(32)
  .regex(/^[+\d][\d\s().-]*$/);

export const leadRequestSchema = z
  .object({
    source: z.enum(PUBLIC_LEAD_SOURCES),
    locale: z.enum(['es', 'en']),
    /** UUID of the client (resent on retries) or `calcom:<booking uid>` (server key only). */
    idempotencyKey: z.string().trim().min(8).max(200),
    contact: z.object({
      name: cleanText(120),
      email: z.email().max(320).optional(),
      phone: phone.optional(),
      company: cleanText(120).optional(),
    }),
    message: cleanText(2000).optional(),
    /** From POST /proposals/generate; required when `source` is `web_proposal`. */
    proposalToken: z.string().min(20).max(6000).optional(),
    /** Lenient on purpose: a stale or mistyped code never loses the lead (it is kept in meta). */
    affiliateCode: z.string().trim().max(40).optional(),
    /** Required unless the request carries the server key. */
    turnstileToken: turnstileTokenSchema.optional(),
    meta: z
      .object({
        path: z
          .string()
          .max(200)
          .regex(/^\/(?!\/)[\w\-./#?=&%~]*$/)
          .optional(),
        utm: z.record(z.string().regex(/^utm_[a-z]{1,20}$/), z.string().max(120)).optional(),
      })
      .optional(),
  })
  .refine((v) => v.contact.email !== undefined || v.contact.phone !== undefined, {
    path: ['contact', 'email'],
    message: 'email or phone is required',
  });

export const leadResponseSchema = z.object({
  leadId: z.uuid(),
  /** `telegram`: Jose was told in this request; `outbox`: the event is queued and the next drain tells him. */
  notified: z.enum(['telegram', 'outbox', 'none']),
});

export const affiliateValidateQuerySchema = z.object({ code: z.string().trim().min(1).max(40) });
export const affiliateValidateResponseSchema = z.object({ valid: z.boolean() });

export type LeadRequest = z.infer<typeof leadRequestSchema>;
export type LeadResponse = z.infer<typeof leadResponseSchema>;
