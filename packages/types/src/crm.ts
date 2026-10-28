import type { Enums } from './db.ts';
import type {
  CONTACT_STATUSES,
  createLeadInputSchema,
  importOrganizationsRowSchema,
  interactionPayloadSchema,
} from './schemas';
import type { z } from 'zod';

// CRM, leads, client area, affiliates and comments (DATOS v1.1 §4.3–§4.5). Unions that mirror a SQL enum are
// `Enums<>` of the generated `database.ts`; the zod value lists in schemas/crm.ts validate at the boundaries and
// test/enums.test-d.ts breaks typecheck when either side drifts. `ContactStatus` is a text column checked by
// `private.contact_status_ok()`, so it stays inferred from the zod map.

export type OrgKind = Enums<'org_kind'>;
export type ContactKind = Enums<'contact_kind'>;
export type ContactSource = Enums<'contact_source'>;
export type ChatCase = Enums<'chat_case'>;
/** `crm_contacts.status` allowed for a kind (`ContactStatus` alone is the union of every kind). */
export type ContactStatus<K extends ContactKind = ContactKind> = (typeof CONTACT_STATUSES)[K][number];
export type InteractionKind = Enums<'interaction_kind'>;
export type InteractionChannel = Enums<'interaction_channel'>;
export type InteractionDirection = Enums<'interaction_direction'>;
export type InteractionActor = Enums<'interaction_actor'>;
export type DraftAuthor = Enums<'draft_author'>;
export type DraftStatus = Enums<'draft_status'>;
export type LeadStatus = Enums<'lead_status'>;
export type LeadSource = Enums<'lead_source'>;
export type ContactVia = Enums<'contact_via'>;
export type ProjectPhase = Enums<'project_phase'>;
export type TaskStatus = Enums<'task_status'>;
export type AssetSource = Enums<'asset_source'>;
export type ClientExtraStatus = Enums<'client_extra_status'>;
export type UpgradeStatus = Enums<'upgrade_status'>;
export type AffiliateLevel = Enums<'affiliate_level'>;
export type RewardType = Enums<'reward_type'>;
export type RewardStatus = Enums<'reward_status'>;
export type CommentStatus = Enums<'comment_status'>;

/** Parsed body of `create_lead(p)`; `CreateLeadInputRaw` is what callers may send before defaults apply. */
export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;
export type CreateLeadInputRaw = z.input<typeof createLeadInputSchema>;
export type InteractionPayload = z.infer<typeof interactionPayloadSchema>;
export type ImportOrganizationsRow = z.infer<typeof importOrganizationsRowSchema>;

/** Row of `create_lead()`. */
export interface CreateLeadResult {
  lead_id: string;
  contact_id: string;
  created: boolean;
}

/** Row of `area_lead_summary()`: five fields, never the whole proposal nor the amount. */
export interface AreaLeadSummary {
  pack_code: string | null;
  pack_option: string | null;
  price_from: number | null;
  status: LeadStatus;
  created_at: string;
}

/** Row of `affiliate_leads()`: no contact data. */
export interface AffiliateLead {
  lead_id: string;
  created_at: string;
  status: LeadStatus;
  pack_code: string | null;
  reward_status: RewardStatus | null;
}

/** Result of `admin_counters()` (C1). */
export interface AdminCounters {
  leads_open: number;
  contacts_due: number;
  chat_unread: number;
  agencies_replied: number;
  comments_pending: number;
  upgrades_pending: number;
  rewards_pending: number;
}
