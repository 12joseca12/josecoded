import { z } from 'zod';

// Custom quotes (task 1.8e, DATOS v1.4 §14.12.3, Q23): built only from extras; the discount is the admin's alone
// (`admin_quote_set_discount`); lines snapshot name and price of the extra when they are added.

export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'] as const;
export const quoteStatusSchema = z.enum(QUOTE_STATUSES);

/** Arguments of `quote_create()`. */
export const quoteInputSchema = z.object({
  contact_id: z.uuid(),
  title: z.string().trim().min(1).max(140),
  lead_id: z.uuid().optional(),
});

/** Arguments of `quote_add_item()` (`quantity` up to 9999.99, as numeric(6,2)). */
export const quoteItemInputSchema = z.object({
  quote_id: z.uuid(),
  extra_code: z.string().regex(/^[a-z][a-z0-9_]{1,31}$/),
  quantity: z.number().positive().max(9999.99).default(1),
});

/** Arguments of `admin_quote_set_discount()`. */
export const quoteDiscountInputSchema = z.object({
  quote_id: z.uuid(),
  amount: z.number().min(0).max(99_999_999),
  note: z.string().trim().max(500).nullable().default(null),
});
