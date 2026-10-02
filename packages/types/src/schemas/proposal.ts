import { z } from 'zod';

import { APP_CODES, extraCodeSchema, PACK_CODES } from './pricing';

/**
 * `ai_proposal` contract between the gateway (3.7/3.8), the Edge Function `notify` and
 * `area_lead_summary()` (DT §0b). The price is never taken from the model: the gateway
 * re-prices with @josecoded/pricing.
 */
export const aiProposalSchema = z
  .object({
    pack: z.enum([...PACK_CODES, ...APP_CODES]),
    priceFrom: z.number().int().nonnegative(),
    isApp: z.boolean(),
    pricingVersion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    extras: z.array(extraCodeSchema),
    source: z.enum(['ai', 'rules']),
    summary: z.string(),
    scope: z.array(z.string()),
  })
  .refine((p) => p.isApp === p.pack.startsWith('APP_'), {
    path: ['isApp'],
    message: 'isApp must match the pack code',
  });
