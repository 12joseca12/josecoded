import { z } from 'zod';

import { APP_CODES, extraCodeSchema, PACK_CODES } from './pricing.ts';
import { cleanText, turnstileTokenSchema } from './text.ts';

// Gateway contract of POST /api/v1/proposals/generate (plan 3.7, DT §3.2). The model never sees or sets a price: the
// gateway prices with @josecoded/pricing and signs the result in `proposalToken` (HMAC, no KV), which POST /leads
// verifies and re-prices.

export const PROPOSAL_LOCALES = ['es', 'en'] as const;
export const SALES_MODES = ['none', 'orders', 'bookings', 'both'] as const;
export const TIMELINES = ['asap', 'one_month', 'three_months', 'flexible'] as const;
export const EXTRAS_INTEREST = ['seo', 'geo', 'security', 'maintenance'] as const;

export const proposalPackCodeSchema = z.enum([...PACK_CODES, ...APP_CODES]);

export const proposalAnswersSchema = z.object({
  businessType: cleanText(120),
  needs: cleanText(600),
  salesMode: z.enum(SALES_MODES),
  timeline: z.enum(TIMELINES),
  extrasInterest: z.array(z.enum(EXTRAS_INTEREST)).max(EXTRAS_INTEREST.length).optional(),
});

export const proposalRequestSchema = z.object({
  locale: z.enum(PROPOSAL_LOCALES),
  turnstileToken: turnstileTokenSchema,
  answers: proposalAnswersSchema,
  /** Pack the visitor came with from /servicios (`?pack=`): a hint for the classifier, never a price. */
  preselectedPack: proposalPackCodeSchema.optional(),
});

export const proposalResponseSchema = z.object({
  proposalId: z.uuid(),
  /** HMAC-signed proposal for POST /leads. Absent when the gateway has no SERVER_KEY (local runs). */
  proposalToken: z.string().optional(),
  pricingVersion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pack: z.object({
    code: proposalPackCodeSchema,
    name: z.string(),
    price: z.number().int().positive(),
    weeks: z.number().int().positive(),
    includes: z.array(z.string()),
  }),
  /** The closed price of the pack; never adds extras. */
  priceFrom: z.number().int().positive(),
  isApp: z.boolean(),
  recommendedExtras: z.array(
    z.object({
      code: extraCodeSchema,
      label: z.string(),
      price: z.number().int().positive(),
      billing: z.enum(['one_off', 'monthly']),
    }),
  ),
  summary: z.string(),
  scope: z.array(z.string()),
  questions: z.array(z.string()),
  source: z.enum(['ai', 'rules']),
  disclaimer: z.string(),
});

/** Output the model must produce (JSON mode); zod validates it again before anything is used. */
export const proposalModelOutputSchema = z.object({
  pack: proposalPackCodeSchema,
  extras: z.array(extraCodeSchema).max(3).default([]),
  summary: z.string().trim().min(1).max(400),
  scope: z.array(z.string().trim().min(1).max(120)).min(3).max(6),
  questions: z.array(z.string().trim().min(1).max(120)).max(2).default([]),
});

export type ProposalRequest = z.infer<typeof proposalRequestSchema>;
export type ProposalResponse = z.infer<typeof proposalResponseSchema>;
export type ProposalModelOutput = z.infer<typeof proposalModelOutputSchema>;
