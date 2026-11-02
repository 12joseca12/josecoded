import type { Enums } from './db.ts';
import type {
  COMMISSION_STATUSES,
  commissionPayInputSchema,
  commissionRejectInputSchema,
  CONFLICT_RESOLUTIONS,
  CONFLICT_STATUSES,
  CONTACT_STATUSES,
  conflictResolutionInputSchema,
  IMPORT_STATUSES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_RECIPIENTS,
  STAFF_ROLES,
  createLeadInputSchema,
  csvContactRowSchema,
  csvImportInputSchema,
  importResultSchema,
  staffInviteInputSchema,
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
// Closers (task 1.8e). Inferred from the zod lists until database.ts is regenerated with the new enums; the test
// test/enums-sql.test.ts compares the lists with the migrations.
export type StaffRole = (typeof STAFF_ROLES)[number];
export type ImportStatus = (typeof IMPORT_STATUSES)[number];
export type ConflictStatus = (typeof CONFLICT_STATUSES)[number];
export type ConflictResolutionKind = (typeof CONFLICT_RESOLUTIONS)[number];
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];
export type NotificationRecipient = (typeof NOTIFICATION_RECIPIENTS)[number];
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/** Parsed body of `create_lead(p)`; `CreateLeadInputRaw` is what callers may send before defaults apply. */
export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;
export type CreateLeadInputRaw = z.input<typeof createLeadInputSchema>;
export type InteractionPayload = z.infer<typeof interactionPayloadSchema>;
export type ImportOrganizationsRow = z.infer<typeof importOrganizationsRowSchema>;
/** Row of a closer's CSV (`CsvContactRowRaw` is what the parser may produce before defaults apply). */
export type CsvContactRow = z.infer<typeof csvContactRowSchema>;
export type CsvContactRowRaw = z.input<typeof csvContactRowSchema>;
export type CsvImportInput = z.infer<typeof csvImportInputSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;
export type ConflictResolution = z.infer<typeof conflictResolutionInputSchema>;
export type StaffInviteInput = z.infer<typeof staffInviteInputSchema>;
export type CommissionRejectInput = z.infer<typeof commissionRejectInputSchema>;
export type CommissionPayInput = z.infer<typeof commissionPayInputSchema>;

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
  // Task 1.8e (DATOS §14.1, §14.12): closers, imports, stories, content and quotes.
  commissions_pending: number;
  imports_failed_24h: number;
  import_conflicts_pending: number;
  stories_proposed: number;
  /** Entries with a draft different from the published value, plus 1 when the price catalogue changed. */
  content_pending: number;
  quotes_draft: number;
}

/** Row of `admin_staff_list()` (D1 «Equipo»). */
export interface StaffListRow {
  user_id: string;
  role: StaffRole;
  display_name: string | null;
  email: string | null;
  disabled_at: string | null;
  commission_rate: number;
  telegram_linked: boolean;
  mfa_enrolled: boolean;
  contacts_count: number;
  commissions_pending: number;
  notes: string | null;
}

/** Result of `crm_my_counters()` (K1). */
export interface CloserCounters {
  contacts_due: number;
  leads_open: number;
  stories_proposed: number;
  commissions_pending: number;
  commissions_approved_amount: number;
  conflicts_pending: number;
  imports_last: { id: string; created: number; updated: number; skipped: number; conflicts: number; created_at: string } | null;
}

/** Result of `crm_team_counters()`: numbers only, no names (global data of DATOS §14.0). */
export interface TeamCounters {
  team_contacts: number;
  team_leads_won_month: number;
  team_leads_open: number;
}
