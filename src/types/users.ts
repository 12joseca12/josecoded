import "@/lib/security/zod-jitless";

import { z } from "zod";

export const inviteRoles = ["closer", "subcloser", "freelance", "client"] as const;
export type InviteRole = (typeof inviteRoles)[number];

export const payoutCadences = ["per_payment", "weekly", "biweekly"] as const;
export type PayoutCadence = (typeof payoutCadences)[number];

export const userRoles = ["admin", "closer", "freelance", "client"] as const;
export const invitationStatuses = ["pending", "accepted", "expired", "revoked"] as const;
export type InvitationStatus = (typeof invitationStatuses)[number];

export const inviteNoteMax = 500;

export const inviteFields = [
  "email",
  "role",
  "parentCloserId",
  "closerRate",
  "parentRate",
  "closerRecurringRate",
  "parentRecurringRate",
  "payoutCadence",
  "note",
] as const;
export type InviteField = (typeof inviteFields)[number];

function parseRate(value: string): number | null {
  const text = value.trim().replace(",", ".");
  if (text === "") return null;
  return /^\d{1,3}(\.\d{1,2})?$/.test(text) ? Number(text) : Number.NaN;
}

export const rate = z
  .string()
  .max(10)
  .transform(parseRate)
  .pipe(z.number().min(0).max(100).nullable());

export const inviteInputSchema = z
  .strictObject({
    email: z.string().trim().toLowerCase().pipe(z.email().max(320)),
    role: z.enum(inviteRoles),
    parentCloserId: z.union([z.uuid(), z.literal("")]).transform((value) => value || null),
    closerRate: rate,
    parentRate: rate,
    closerRecurringRate: rate,
    parentRecurringRate: rate,
    payoutCadence: z.union([z.enum(payoutCadences), z.literal("")]).transform((v) => v || null),
    note: z.string().trim().max(inviteNoteMax),
    projectId: z
      .union([z.uuid(), z.literal("")])
      .transform((value) => value || null)
      .optional(),
  })
  .superRefine((value, ctx) => {
    const fail = (path: InviteField) => {
      ctx.addIssue({ code: "custom", path: [path] });
    };
    const sub = value.role === "subcloser";
    const closerLike = sub || value.role === "closer";
    if (value.projectId && value.role !== "client") fail("role");
    if (sub && value.parentCloserId === null) fail("parentCloserId");
    if (!sub && value.parentCloserId !== null) fail("parentCloserId");
    if (!sub && (value.parentRate !== null || value.parentRecurringRate !== null)) {
      fail("parentRate");
    }
    if (
      !closerLike &&
      (value.closerRate !== null ||
        value.closerRecurringRate !== null ||
        value.payoutCadence !== null)
    ) {
      fail("closerRate");
    }
    if (
      value.closerRecurringRate !== null &&
      value.closerRate !== null &&
      value.closerRecurringRate >= value.closerRate
    ) {
      fail("closerRecurringRate");
    }
    if (
      value.parentRecurringRate !== null &&
      value.parentRate !== null &&
      value.parentRecurringRate >= value.parentRate
    ) {
      fail("parentRecurringRate");
    }
  });

export type InviteInput = z.infer<typeof inviteInputSchema>;

export const inviteErrorCodes = [
  "email_already_invited",
  "email_already_member",
  "invalid_parent_closer",
  "rates_recurring_not_lower",
  "rate_out_of_range",
  "forbidden",
  "unavailable",
  "error",
] as const;
export type InviteErrorCode = (typeof inviteErrorCodes)[number];

export type InviteActionResult =
  | { status: "done"; invitationId: string; path: string }
  | { status: "invalid"; field: InviteField }
  | { status: "error"; code: InviteErrorCode };

export const invitationActionSchema = z.strictObject({ invitationId: z.uuid() });

export type InvitationActionResult =
  | { status: "done"; path: string | null }
  | { status: "error"; code: InviteErrorCode | "invitation_used" | "invitation_revoked" };

export type InviteHandler = (raw: unknown) => Promise<InviteActionResult>;
export type InvitationHandler = (raw: unknown) => Promise<InvitationActionResult>;

export const userRowSchema = z.object({
  id: z.uuid(),
  email: z.string().nullable(),
  full_name: z.string(),
  role: z.enum(userRoles),
  is_active: z.boolean(),
  archived_at: z.string().nullable(),
  parent_closer_id: z.uuid().nullable(),
  closer_rate: z.number().nullable(),
  parent_rate: z.number().nullable(),
  closer_recurring_rate: z.number().nullable(),
  parent_recurring_rate: z.number().nullable(),
  payout_cadence: z.enum(payoutCadences).nullable(),
  has_totp: z.boolean(),
  contacts_count: z.number(),
  open_deals: z.number(),
  accrued_pending: z.number(),
});

export type UserRow = z.infer<typeof userRowSchema>;

export const invitationRowSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  role: z.enum(userRoles),
  invited_by: z.uuid().nullable(),
  expires_at: z.string(),
  accepted_at: z.string().nullable(),
  revoked_at: z.string().nullable(),
  created_at: z.string(),
  parent_closer_id: z.uuid().nullable(),
});

export type InvitationRow = z.infer<typeof invitationRowSchema>;

export type UsersResult =
  { status: "ok"; users: UserRow[]; invitations: InvitationRow[] } | { status: "error" };

export interface InviteSheetLabels {
  open: string;
  title: string;
  close: string;
  email: string;
  role: string;
  roles: Record<InviteRole, string>;
  parent: string;
  parentPlaceholder: string;
  noParents: string;
  rates: string;
  closerRate: string;
  parentRate: string;
  closerRecurringRate: string;
  parentRecurringRate: string;
  rateHint: string;
  cadence: string;
  cadences: Record<PayoutCadence, string>;
  cadenceDefault: string;
  note: string;
  optional: string;
  preview: string;
  previewProject: string;
  previewParent: string;
  previewRecurring: string;
  submit: string;
  submitting: string;
  doneTitle: string;
  doneText: string;
  linkLabel: string;
  copy: string;
  copied: string;
  another: string;
  errors: Record<InviteField | InviteErrorCode, string>;
}

export interface InvitationActionLabels {
  renew: string;
  renewing: string;
  revoke: string;
  revokeConfirm: string;
  revoking: string;
  cancel: string;
  linkLabel: string;
  copy: string;
  copied: string;
  doneRenew: string;
  doneRevoke: string;
  errors: Record<InviteErrorCode | "invitation_used" | "invitation_revoked", string>;
}

export interface UserTableLabels {
  region: string;
  caption: string;
  columns: {
    name: string;
    role: string;
    status: string;
    parent: string;
    rates: string;
    cadence: string;
    totp: string;
    contacts: string;
    deals: string;
    pending: string;
    actions: string;
  };
  roles: Record<(typeof userRoles)[number], string>;
  subcloser: string;
  active: string;
  inactive: string;
  totpYes: string;
  totpNo: string;
  cadences: Record<PayoutCadence, string>;
  none: string;
}

export interface InvitationListLabels {
  title: string;
  empty: string;
  region: string;
  caption: string;
  columns: {
    email: string;
    role: string;
    by: string;
    expires: string;
    status: string;
    actions: string;
  };
  roles: Record<(typeof userRoles)[number], string>;
  status: Record<InvitationStatus, string>;
  subcloser: string;
  unknownInviter: string;
  actions: InvitationActionLabels;
}
