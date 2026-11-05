import "@/lib/security/zod-jitless";

import { z } from "zod";

import { payoutCadences, rate } from "./users";

export const rateFields = [
  "closerRate",
  "parentRate",
  "closerRecurringRate",
  "parentRecurringRate",
  "payoutCadence",
] as const;
export type RateField = (typeof rateFields)[number];

export const ratesInputSchema = z
  .strictObject({
    userId: z.uuid(),
    closerRate: rate,
    parentRate: rate,
    closerRecurringRate: rate,
    parentRecurringRate: rate,
    payoutCadence: z.union([z.enum(payoutCadences), z.literal("")]).transform((v) => v || null),
  })
  .superRefine((value, ctx) => {
    const fail = (path: RateField) => {
      ctx.addIssue({ code: "custom", path: [path] });
    };
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

export const activeInputSchema = z.strictObject({ userId: z.uuid(), active: z.boolean() });
export const reassignInputSchema = z.strictObject({ fromUserId: z.uuid(), toUserId: z.uuid() });
export const userIdInputSchema = z.strictObject({ userId: z.uuid() });

export const manageErrorCodes = [
  "forbidden",
  "user_not_found",
  "rates_recurring_not_lower",
  "rate_out_of_range",
  "parent_rate_needs_parent",
  "rates_only_for_closers",
  "closer_has_subclosers",
  "last_admin_required",
  "parent_closer_inactive",
  "invalid_assignee",
  "contact_email_conflict",
  "cannot_reset_self",
  "unavailable",
  "unlogged",
  "error",
] as const;
export type ManageErrorCode = (typeof manageErrorCodes)[number];

export type ManageResult =
  | { status: "done" }
  | { status: "invalid"; field: RateField | "userId" }
  | { status: "error"; code: ManageErrorCode };

export type ReassignResult =
  | { status: "done"; contacts: number; deals: number; leads: number }
  | { status: "error"; code: ManageErrorCode };

export const historyFields = [
  "role",
  "parent_closer_id",
  "closer_rate",
  "parent_rate",
  "closer_recurring_rate",
  "parent_recurring_rate",
  "payout_cadence",
  "is_active",
  "archived_at",
] as const;
export type HistoryField = (typeof historyFields)[number];

export interface HistoryChange {
  field: HistoryField;
  before: string | null;
  after: string | null;
}

export interface HistoryEntry {
  id: number;
  at: string;
  actor: string | null;
  kind: "insert" | "update" | "totp_reset";
  changes: HistoryChange[];
}

export type HistoryResult = { status: "ok"; entries: HistoryEntry[] } | { status: "error" };

export type ManageHandler = (raw: unknown) => Promise<ManageResult>;
export type ReassignHandler = (raw: unknown) => Promise<ReassignResult>;
export type HistoryHandler = (raw: unknown) => Promise<HistoryResult>;

export interface ManageHandlers {
  rates: ManageHandler;
  active: ManageHandler;
  reassign: ReassignHandler;
  resetTotp: ManageHandler;
  history: HistoryHandler;
}

export interface ReassignTarget {
  id: string;
  name: string;
}

export interface UserSheetLabels {
  open: string;
  openFor: string;
  title: string;
  close: string;
  ratesTitle: string;
  noRates: string;
  closerRate: string;
  closerRecurringRate: string;
  parentRate: string;
  parentRecurringRate: string;
  rateHint: string;
  cadence: string;
  cadenceDefault: string;
  cadences: Record<(typeof payoutCadences)[number], string>;
  saveRates: string;
  savingRates: string;
  ratesSaved: string;
  statusTitle: string;
  activeText: string;
  inactiveText: string;
  deactivate: string;
  deactivateConfirm: string;
  reactivate: string;
  working: string;
  deactivated: string;
  reactivated: string;
  portfolioTitle: string;
  portfolioText: string;
  portfolioCounts: string;
  reassignTo: string;
  reassignPlaceholder: string;
  reassignNoTargets: string;
  reassign: string;
  reassignConfirm: string;
  reassigning: string;
  reassigned: string;
  securityTitle: string;
  securityText: string;
  resetTotp: string;
  resetTotpConfirm: string;
  resetting: string;
  resetDone: string;
  historyTitle: string;
  historyLoading: string;
  historyEmpty: string;
  historyActorUnknown: string;
  historyInsert: string;
  historyTotpReset: string;
  historyEmptyValue: string;
  historyFields: Record<HistoryField, string>;
  errors: Record<ManageErrorCode | RateField | "userId" | "history", string>;
}
