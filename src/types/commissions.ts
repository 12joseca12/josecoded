import "@/lib/security/zod-jitless";

import { z } from "zod";

import {
  commissionHeaderSchema,
  commissionLineSchema,
  type commissionLineStatuses,
  type commissionNatures,
  type commissionRoles,
  payoutStatuses,
} from "./money";

export const commissionFilters = ["accrued", "approved", "paid", "reversed"] as const;
export type CommissionFilter = (typeof commissionFilters)[number];

export const commissionViews = ["lines", "headers"] as const;
export type CommissionView = (typeof commissionViews)[number];

const contactRef = z.object({ full_name: z.string() });
const dealRef = z.object({ contacts: contactRef.nullable() });

export const commissionLineRowSchema = commissionLineSchema.extend({
  commissions: z.object({ deals: dealRef.nullable() }).nullable(),
});

export type CommissionLineRow = z.infer<typeof commissionLineRowSchema>;

export const commissionHeaderRowSchema = commissionHeaderSchema.extend({
  deals: dealRef.nullable(),
});

export type CommissionHeaderRow = z.infer<typeof commissionHeaderRowSchema>;

export const payoutRefSchema = z.object({
  id: z.uuid(),
  period_start: z.string(),
  period_end: z.string(),
  status: z.enum(payoutStatuses),
});

export type PayoutRef = z.infer<typeof payoutRefSchema>;

export const personRefSchema = z.object({ id: z.uuid(), full_name: z.string() });

export type CommissionsResult =
  | {
      status: "ok";
      lines: CommissionLineRow[];
      headers: CommissionHeaderRow[];
      payouts: PayoutRef[];
      names: Record<string, string>;
    }
  | { status: "error" };

export interface CommissionTotalsValue {
  accrued: number;
  approved: number;
  paid: number;
  reversed: number;
}

export const approveLinesSchema = z.strictObject({ ids: z.array(z.uuid()).min(1).max(200) });
export const rejectLineSchema = z.strictObject({
  id: z.uuid(),
  reason: z.string().trim().min(1).max(500),
});

export type ApproveErrorCode = "invalid_selection" | "line_not_accrued" | "forbidden" | "error";
export type RejectErrorCode =
  "reason_required" | "line_not_accrued" | "line_not_found" | "forbidden" | "error";

export type ApproveResult =
  { status: "done"; count: number } | { status: "failed"; code: ApproveErrorCode };
export type RejectResult = { status: "done" } | { status: "failed"; code: RejectErrorCode };

export type ApproveHandler = (raw: unknown) => Promise<ApproveResult>;
export type RejectHandler = (raw: unknown) => Promise<RejectResult>;

export interface CommissionTotalsLabels {
  label: string;
  all: string;
  accrued: string;
  approved: string;
  paid: string;
  reversed: string;
}

export interface CommissionLineTableLabels {
  caption: string;
  region: string;
  columns: {
    select: string;
    date: string;
    contact: string;
    beneficiary: string;
    nature: string;
    base: string;
    rate: string;
    amount: string;
    status: string;
    payout: string;
    actions: string;
  };
  selectAll: string;
  selectAria: string;
  preparing: string;
  noPayout: string;
  inPayout: string;
  unknownPerson: string;
  rejectedReason: string;
  roles: Record<(typeof commissionRoles)[number], string>;
  natures: Record<(typeof commissionNatures)[number], string>;
  statuses: Record<(typeof commissionLineStatuses)[number], string>;
  approve: {
    submit: string;
    none: string;
    saving: string;
    done: string;
    selected: string;
    errors: Record<ApproveErrorCode, string>;
  };
  reject: {
    open: string;
    openAria: string;
    title: string;
    close: string;
    reason: string;
    submit: string;
    saving: string;
    done: string;
    errors: Record<RejectErrorCode, string>;
  };
}

export interface CommissionHeaderTableLabels {
  caption: string;
  region: string;
  columns: {
    contact: string;
    closer: string;
    subcloser: string;
    rates: string;
    expected: string;
    accrued: string;
  };
  rates: string;
  noRecurring: string;
  empty: string;
  unknownPerson: string;
}
