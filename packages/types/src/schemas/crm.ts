import { z } from 'zod';

import { aiProposalSchema } from './proposal.ts';

// CRM, leads, client area, affiliates and comments (DATOS v1.1 §4.3–§4.5, plan 1.8a).
// The value lists mirror the SQL enums of supabase/migrations/20261028100100…100600 one to one; the test
// test/crm.test.ts reads the migrations and fails on any drift. Once `database.ts` is generated from Supabase local,
// the same test also compares them with `Enums<>`.

export const ORG_KINDS = ['agency', 'company', 'local_business', 'recruiter_firm', 'other'] as const;
export const CONTACT_KINDS = ['lead', 'client', 'agency', 'recruiter', 'other'] as const;
export const CONTACT_SOURCES = [
  'web_form',
  'web_proposal',
  'chat',
  'calcom',
  'partner_form',
  'import_agencias',
  'manual',
  'radar',
  'newsletter_interest',
] as const;
export const CHAT_CASES = ['client', 'partner', 'recruiter', 'curious'] as const;
export const INTERACTION_KINDS = [
  'note',
  'message_sent',
  'message_received',
  'meeting',
  'call',
  'chat_thread',
  'status_change',
  'import',
  'lead_created',
  'lead_won',
  'lead_lost',
] as const;
export const INTERACTION_CHANNELS = [
  'linkedin_invite',
  'linkedin_inmail',
  'email',
  'whatsapp',
  'calcom',
  'web_form',
  'web_proposal',
  'chat',
  'other',
] as const;
export const INTERACTION_DIRECTIONS = ['out', 'in', 'internal'] as const;
export const INTERACTION_ACTORS = ['jose', 'ai', 'system', 'contact'] as const;
export const DRAFT_AUTHORS = ['ai', 'jose'] as const;
export const DRAFT_STATUSES = ['draft', 'copied', 'marked_sent', 'discarded'] as const;
export const LEAD_STATUSES = ['open', 'won', 'lost'] as const;
export const LEAD_SOURCES = [
  'web_form',
  'web_proposal',
  'chat',
  'calcom',
  'partner_form',
  'manual',
  'referral',
] as const;
export const CONTACT_VIAS = ['client', 'partner', 'recruiter', 'other'] as const;
export const PROJECT_PHASES = ['kickoff', 'design', 'build', 'review', 'delivered', 'maintenance'] as const;
export const TASK_STATUSES = ['pending', 'in_progress', 'done'] as const;
export const ASSET_SOURCES = ['client', 'admin'] as const;
export const CLIENT_EXTRA_STATUSES = ['included', 'requested', 'active', 'rejected'] as const;
export const UPGRADE_STATUSES = ['pending', 'accepted', 'rejected'] as const;
export const AFFILIATE_LEVELS = ['standard', 'premium'] as const;
export const REWARD_TYPES = ['maintenance_months', 'percent'] as const;
export const REWARD_STATUSES = ['pending', 'paid'] as const;
export const COMMENT_STATUSES = ['pending', 'approved', 'rejected'] as const;

/** Valid `crm_contacts.status` per kind: mirror of `private.contact_status_ok()`. */
export const CONTACT_STATUSES = {
  lead: ['new', 'contacted', 'proposal_sent', 'won', 'lost', 'active_client', 'closed'],
  client: ['new', 'contacted', 'proposal_sent', 'won', 'lost', 'active_client', 'closed'],
  agency: ['pending', 'invited', 'inmail_sent', 'replied', 'meeting', 'collaborating', 'discarded'],
  recruiter: ['new', 'in_process', 'interview', 'offer', 'rejected', 'closed'],
  other: ['new', 'active', 'closed'],
} as const satisfies Record<(typeof CONTACT_KINDS)[number], readonly string[]>;

/** Statuses that need no next action: mirror of `private.contact_status_terminal()`. */
export const TERMINAL_CONTACT_STATUSES = [
  'won',
  'lost',
  'active_client',
  'closed',
  'discarded',
  'rejected',
] as const;

export const orgKindSchema = z.enum(ORG_KINDS);
export const contactKindSchema = z.enum(CONTACT_KINDS);
export const contactSourceSchema = z.enum(CONTACT_SOURCES);
export const chatCaseSchema = z.enum(CHAT_CASES);
export const interactionKindSchema = z.enum(INTERACTION_KINDS);
export const interactionChannelSchema = z.enum(INTERACTION_CHANNELS);
export const leadStatusSchema = z.enum(LEAD_STATUSES);
export const leadSourceSchema = z.enum(LEAD_SOURCES);
export const contactViaSchema = z.enum(CONTACT_VIAS);

/**
 * `affiliates.code` check of the database: the single contract of `AFFILIATE_CODE_RE` in `@josecoded/pricing` (prefix
 * 3–12, suffix of exactly 6, what `private.set_affiliate_code()` generates). Tests in both packages compare them.
 */
export const AFFILIATE_CODE_DB_RE = /^[A-Z0-9]{3,12}-[A-Z0-9]{6}$/;

/**
 * Body of `create_lead(p jsonb)` (gateway POST /leads, DATOS §4.3). The gateway parses with this schema and passes
 * the result as `p`; the RPC finds or creates the contact by email and is idempotent by `idempotency_key`.
 */
export const createLeadInputSchema = z
  .object({
    email: z.email().max(320).optional(),
    phone: z.string().trim().min(6).max(32).optional(),
    display_name: z.string().trim().min(1).max(200).optional(),
    source: leadSourceSchema,
    via: contactViaSchema.default('client'),
    locale: z.enum(['es', 'en']).default('es'),
    idempotency_key: z.string().trim().min(8).max(200),
    message: z.string().trim().max(5000).optional(),
    pack_code: z
      .string()
      .regex(/^P[1-9]$/)
      .optional(),
    pack_option: z.string().min(1).max(40).optional(),
    ai_proposal: aiProposalSchema.optional(),
    affiliate_code: z.string().regex(AFFILIATE_CODE_DB_RE).optional(),
    user_id: z.uuid().optional(),
    chat_case: chatCaseSchema.optional(),
    meta: z.record(z.string(), z.unknown()).default({}),
  })
  .refine((v) => v.email !== undefined || v.phone !== undefined, {
    path: ['email'],
    message: 'email or phone is required',
  });

const statusChangePayload = z.object({ from: z.string(), to: z.string() });
const leadCreatedPayload = z.object({ source: leadSourceSchema, via: contactViaSchema });
const leadWonPayload = z.object({
  amount: z.number().nonnegative(),
  client_id: z.uuid().nullable().optional(),
  reward_id: z.uuid().nullable().optional(),
});

/**
 * `crm_interactions` kind + payload. The database writes status_change (trigger), lead_created (create_lead) and
 * lead_won (admin_close_lead_paid); the other kinds carry a free object written by the admin.
 */
export const interactionPayloadSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('status_change'), payload: statusChangePayload }),
  z.object({ kind: z.literal('lead_created'), payload: leadCreatedPayload }),
  z.object({ kind: z.literal('lead_won'), payload: leadWonPayload }),
  z.object({
    kind: z.enum([
      'note',
      'message_sent',
      'message_received',
      'meeting',
      'call',
      'chat_thread',
      'import',
      'lead_lost',
    ]),
    payload: z.record(z.string(), z.unknown()),
  }),
]);

/** One row of `crm_import_organizations(p_rows jsonb)` (C5 import from the agencies sheet). */
export const importOrganizationsRowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  kind: orgKindSchema,
  website: z.url().optional(),
  city: z.string().trim().max(120).optional(),
  size: z.string().trim().max(60).optional(),
  fit: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(5000).optional(),
  source: contactSourceSchema.optional(),
  notion_url: z.url().optional(),
});
