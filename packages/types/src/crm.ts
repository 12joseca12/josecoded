import type {
  AFFILIATE_LEVELS,
  ASSET_SOURCES,
  CHAT_CASES,
  CLIENT_EXTRA_STATUSES,
  COMMENT_STATUSES,
  CONTACT_KINDS,
  CONTACT_SOURCES,
  CONTACT_STATUSES,
  CONTACT_VIAS,
  createLeadInputSchema,
  DRAFT_AUTHORS,
  DRAFT_STATUSES,
  importOrganizationsRowSchema,
  INTERACTION_ACTORS,
  INTERACTION_CHANNELS,
  INTERACTION_DIRECTIONS,
  INTERACTION_KINDS,
  interactionPayloadSchema,
  LEAD_SOURCES,
  LEAD_STATUSES,
  ORG_KINDS,
  PROJECT_PHASES,
  REWARD_STATUSES,
  REWARD_TYPES,
  TASK_STATUSES,
  UPGRADE_STATUSES,
} from './schemas';
import type { z } from 'zod';

// CRM, leads, client area, affiliates and comments (DATOS v1.1 §4.3–§4.5). The unions come from the value lists in
// schemas/crm.ts, which mirror the SQL enums (test/crm.test.ts). Rows and RPC results use Tables<>/Enums<> from
// `db.ts` once `database.ts` is generated from Supabase local.

export type OrgKind = (typeof ORG_KINDS)[number];
export type ContactKind = (typeof CONTACT_KINDS)[number];
export type ContactSource = (typeof CONTACT_SOURCES)[number];
export type ChatCase = (typeof CHAT_CASES)[number];
/** `crm_contacts.status` allowed for a kind (`ContactStatus` alone is the union of every kind). */
export type ContactStatus<K extends ContactKind = ContactKind> = (typeof CONTACT_STATUSES)[K][number];
export type InteractionKind = (typeof INTERACTION_KINDS)[number];
export type InteractionChannel = (typeof INTERACTION_CHANNELS)[number];
export type InteractionDirection = (typeof INTERACTION_DIRECTIONS)[number];
export type InteractionActor = (typeof INTERACTION_ACTORS)[number];
export type DraftAuthor = (typeof DRAFT_AUTHORS)[number];
export type DraftStatus = (typeof DRAFT_STATUSES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type ContactVia = (typeof CONTACT_VIAS)[number];
export type ProjectPhase = (typeof PROJECT_PHASES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type AssetSource = (typeof ASSET_SOURCES)[number];
export type ClientExtraStatus = (typeof CLIENT_EXTRA_STATUSES)[number];
export type UpgradeStatus = (typeof UPGRADE_STATUSES)[number];
export type AffiliateLevel = (typeof AFFILIATE_LEVELS)[number];
export type RewardType = (typeof REWARD_TYPES)[number];
export type RewardStatus = (typeof REWARD_STATUSES)[number];
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

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
