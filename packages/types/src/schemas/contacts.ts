import { z } from 'zod';

import { CONTACT_STATUSES, contactKindSchema } from './crm.ts';

// Inputs of the contacts screens of /crm (task 6.2, K2 and K3): the filters of the inbox in the URL and the forms of
// the Server Actions. Every action parses with these before it touches the database; RLS stays the authority.

/** Rows per page of the inbox. */
export const CONTACTS_PAGE_SIZE = 25;

/** Longest free text a contact field accepts (next action, names, notes are longer). */
const SHORT = 200;

const allStatuses: readonly string[] = [...new Set(Object.values(CONTACT_STATUSES).flat())];
export const contactStatusSchema = z.string().refine((value) => allStatuses.includes(value));

/** `?owner=` of the inbox, admin only: `mine`, `unassigned` or the id of a staff member. */
export const ownerFilterSchema = z.union([z.literal('mine'), z.literal('unassigned'), z.uuid()]);
export type OwnerFilter = z.infer<typeof ownerFilterSchema>;

/**
 * Filters of the inbox in the URL (`?kind&status&due=1&q&owner&page`). A value that does not parse is dropped, never
 * an error: a stale link still opens the inbox.
 */
export const contactListQuerySchema = z.object({
  kind: contactKindSchema.optional().catch(undefined),
  status: contactStatusSchema.optional().catch(undefined),
  due: z
    .union([z.literal('1'), z.literal('true')])
    .transform(() => true)
    .optional()
    .catch(undefined),
  q: z.string().trim().max(80).optional().catch(undefined),
  owner: ownerFilterSchema.optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
});
export type ContactListQuery = z.infer<typeof contactListQuerySchema>;

/** `YYYY-MM-DD` as a date input sends it, and `HH:MM` as a time input does. */
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeField = z.string().regex(/^\d{2}:\d{2}$/);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === '' ? undefined : value))
    .optional();

/** The next action: text, day and (optional) time, Madrid wall clock. */
export const nextActionFields = {
  next_action: optionalText(SHORT),
  next_action_date: dateField.optional().catch(undefined),
  next_action_time: timeField.optional().catch(undefined),
};

export const setNextActionInputSchema = z.object({
  contact_id: z.uuid(),
  next_action: z.string().trim().min(1).max(SHORT),
  next_action_date: dateField,
  next_action_time: timeField.optional().catch(undefined),
});
export type SetNextActionInput = z.infer<typeof setNextActionInputSchema>;

export const changeStatusInputSchema = z.object({
  contact_id: z.uuid(),
  status: contactStatusSchema,
  ...nextActionFields,
});
export type ChangeStatusInput = z.infer<typeof changeStatusInputSchema>;

export const addNoteInputSchema = z.object({
  contact_id: z.uuid(),
  body: z.string().trim().min(1).max(4000),
});
export type AddNoteInput = z.infer<typeof addNoteInputSchema>;

export const newContactInputSchema = z.object({
  kind: contactKindSchema,
  display_name: z.string().trim().min(1).max(SHORT),
  organization: optionalText(SHORT),
  email: z
    .string()
    .trim()
    .max(254)
    .transform((value) => (value === '' ? undefined : value))
    .pipe(z.email().optional())
    .optional(),
  phone: optionalText(40),
  linkedin_url: optionalText(300),
  /** Left out, the contact starts in the first status of its kind. */
  status: contactStatusSchema.optional().catch(undefined),
  ...nextActionFields,
  /** Admin only: the owner. A closer's contact always belongs to him, whatever this says. */
  owner_id: z.union([z.uuid(), z.literal('')]).optional(),
});
export type NewContactInput = z.infer<typeof newContactInputSchema>;

export const reassignContactInputSchema = z.object({
  contact_id: z.uuid(),
  /** A staff member, or empty for «sin asignar» (the portfolio of Jose). */
  owner_id: z.union([z.uuid(), z.literal('')]),
});
export type ReassignContactInput = z.infer<typeof reassignContactInputSchema>;

export const inviteAccessInputSchema = z.object({
  client_id: z.uuid(),
  contact_id: z.uuid(),
  /** Empty means the email of the contact: only the admin writes another one (the RPC enforces it). */
  email: z.union([z.email().max(254), z.literal('')]),
});
export type InviteAccessInput = z.infer<typeof inviteAccessInputSchema>;

export const requestCloseInputSchema = z.object({ lead_id: z.uuid(), contact_id: z.uuid() });
export type RequestCloseInput = z.infer<typeof requestCloseInputSchema>;

/** The amount as Spanish people type it: `1400`, `1.400,50`, `1400.5`. */
export function parseAmount(raw: string): number | null {
  const text = raw.trim().replace(/\s|€/g, '');
  if (text === '') return null;
  let normal = text;
  if (text.includes(',')) normal = text.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(text)) normal = text.replace(/\./g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(normal)) return null;
  return Number(normal);
}

/** «Cerrar cobrado» (admin). `commission` is Jose's call about the owner closer's commission: `auto` leaves it to the RPC. */
export const closePaidInputSchema = z.object({
  lead_id: z.uuid(),
  contact_id: z.uuid(),
  amount: z
    .string()
    .transform((raw, ctx) => {
      const amount = parseAmount(raw);
      if (amount === null || amount > 99_999_999) {
        ctx.addIssue({ code: 'custom', message: 'amount' });
        return z.NEVER;
      }
      return amount;
    }),
  paid_at: dateField.optional().catch(undefined),
  commission: z.enum(['auto', 'yes', 'no']).catch('auto'),
});
export type ClosePaidInput = z.infer<typeof closePaidInputSchema>;
