import { z } from 'zod';

// Input of the D1 Server Actions (task 6.13). Every field arrives as text from a form: zod is the border and the
// types of the actions are inferred from it. The bounds repeat the database (`staff_invites.commission_rate between
// 0 and 100`, numeric(5,2)); the RPCs check them again, they are not a courtesy.

/** Roles an invitation can carry. `admin` is never invited from the web: Jose's row is the only one. */
export const INVITABLE_ROLES = ['closer'] as const;

/** «10», «12,5» or «7.25» → a number from 0 to 100 with at most two decimals. */
const rateSchema = z
  .string()
  .trim()
  .regex(/^\d{1,3}([.,]\d{1,2})?$/)
  .transform((value) => Number(value.replace(',', '.')))
  .pipe(z.number().min(0).max(100));

/** Lower-cased and trimmed: the invitation is matched to the signed-in email as the database compares it. */
const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());

export const inviteStaffSchema = z.object({
  email: emailSchema,
  role: z.enum(INVITABLE_ROLES),
  rate: rateSchema,
});

export const inviteIdSchema = z.object({ id: z.uuid() });

export const setStaffSchema = z.object({
  id: z.uuid(),
  disabled: z.enum(['true', 'false']).transform((value) => value === 'true'),
});

export const setRateSchema = z.object({ user_id: z.uuid(), rate: rateSchema });

export const reassignContactsSchema = z.object({ from: z.uuid(), to: z.uuid() });
