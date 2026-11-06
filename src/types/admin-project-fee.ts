import "@/lib/security/zod-jitless";

import { z } from "zod";

import { parseMoneyToCents, toCents } from "@/lib/money";

export const feeModes = ["hourly", "milestones", "fixed"] as const;
export type FeeMode = (typeof feeModes)[number];

export const feeItemStatuses = ["pending", "delivered", "approved", "rejected", "paid"] as const;
export type FeeItemStatus = (typeof feeItemStatuses)[number];

export const feeFields = [
  "mode",
  "amount",
  "hourlyRate",
  "hoursCap",
  "note",
  "label",
  "workedOn",
  "reason",
  "ids",
] as const;
export type FeeField = (typeof feeFields)[number];

export const feeErrorCodes = [
  "forbidden",
  "project_not_found",
  "project_archived",
  "project_has_no_freelance",
  "invalid_fee",
  "fee_has_items",
  "fee_not_found",
  "fee_mode_mismatch",
  "fee_amount_exceeded",
  "hours_cap_exceeded",
  "fee_closed",
  "invalid_label",
  "invalid_amount",
  "reason_required",
  "item_not_found",
  "item_not_approvable",
  "item_not_pending",
  "invalid_selection",
  "unavailable",
  "error",
] as const;
export type FeeErrorCode = (typeof feeErrorCodes)[number];

export const feeNoteMax = 1000;
export const feeLabelMax = 120;
export const feeReasonMax = 500;

const euros = z.number().transform(toCents);
const eurosOrNull = z
  .number()
  .nullable()
  .transform((value) => (value === null ? null : toCents(value)));

export const feeSummarySchema = z.object({
  fee_id: z.uuid(),
  project_id: z.uuid(),
  freelance_id: z.uuid(),
  mode: z.enum(feeModes),
  amount: eurosOrNull,
  hourly_rate: eurosOrNull,
  hours_cap: z.number().nullable(),
  closed_at: z.string().nullable(),
  agreed_total: eurosOrNull,
  hours_approved: z.number(),
  pending_amount: euros,
  delivered_amount: euros,
  approved_unpaid_amount: euros,
  paid_amount: euros,
});
export type FeeSummary = z.infer<typeof feeSummarySchema>;

export const feeItemSchema = z.object({
  id: z.uuid(),
  fee_id: z.uuid(),
  label: z.string(),
  hours: z.number().nullable(),
  amount: euros,
  worked_on: z.string(),
  status: z.enum(feeItemStatuses),
  rejected_reason: z.string().nullable(),
  submitted_by: z.uuid().nullable(),
});
export type FeeItem = z.infer<typeof feeItemSchema>;

export type FeeResult =
  { status: "ok"; fee: FeeSummary | null; items: FeeItem[] } | { status: "error" };

function moneyField(field: FeeField) {
  return z.string().transform((value, ctx) => {
    if (value.trim() === "") return null;
    const cents = parseMoneyToCents(value);
    if (cents === null || cents === 0) {
      ctx.addIssue({ code: "custom", path: [field], message: field });
      return z.NEVER;
    }
    return cents;
  });
}

const hoursField = z.string().transform((value, ctx) => {
  const cleaned = value.trim().replace(",", ".");
  if (cleaned === "") return null;
  const parsed = Number(cleaned);
  if (!/^[0-9]+(\.[0-9])?$/.test(cleaned) || parsed <= 0 || parsed >= 100000) {
    ctx.addIssue({ code: "custom", path: ["hoursCap"], message: "hoursCap" });
    return z.NEVER;
  }
  return parsed;
});

export const feeInputSchema = z
  .strictObject({
    projectId: z.uuid(),
    mode: z.enum(feeModes),
    amount: moneyField("amount"),
    hourlyRate: moneyField("hourlyRate"),
    hoursCap: hoursField,
    note: z
      .string()
      .max(feeNoteMax)
      .transform((value) => value.trim() || null),
    firstItemLabel: z.string().trim().max(feeLabelMax),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "fixed" && value.amount === null) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "amount" });
    }
    if (value.mode === "hourly" && value.hourlyRate === null) {
      ctx.addIssue({ code: "custom", path: ["hourlyRate"], message: "hourlyRate" });
    }
  });

export const addItemSchema = z.strictObject({
  feeId: z.uuid(),
  label: z.string().trim().min(1).max(feeLabelMax),
  amount: z.string().transform((value, ctx) => {
    const cents = parseMoneyToCents(value);
    if (cents === null || cents === 0) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "amount" });
      return z.NEVER;
    }
    return cents;
  }),
  workedOn: z.union([z.iso.date(), z.literal("")]).transform((value) => value || null),
});

export const approveSchema = z.strictObject({
  ids: z.array(z.uuid()).min(1).max(200),
});

export const rejectSchema = z.strictObject({
  id: z.uuid(),
  reason: z.string().trim().min(1).max(feeReasonMax),
});

export const deleteItemSchema = z.strictObject({ id: z.uuid() });

export type FeeActionResult =
  | { status: "done"; count?: number }
  | { status: "invalid"; field: FeeField }
  | { status: "error"; code: FeeErrorCode };

export type FeeHandler = (raw: unknown) => Promise<FeeActionResult>;

export interface FeeSheetLabels {
  open: string;
  openEdit: string;
  title: string;
  close: string;
  mode: string;
  modes: Record<FeeMode, string>;
  amount: string;
  amountHint: string;
  hourlyRate: string;
  hoursCap: string;
  hoursCapHint: string;
  note: string;
  optional: string;
  modeLocked: string;
  fixedItemLabel: string;
  submit: string;
  submitting: string;
  done: string;
  errors: Record<FeeField | FeeErrorCode, string>;
}

export interface AddItemSheetLabels {
  open: string;
  title: string;
  close: string;
  label: string;
  amount: string;
  remaining: string;
  workedOn: string;
  optional: string;
  submit: string;
  submitting: string;
  done: string;
  errors: Record<FeeField | FeeErrorCode, string>;
}

export interface FeeItemTableLabels {
  caption: string;
  region: string;
  empty: string;
  select: string;
  columns: {
    select: string;
    label: string;
    hours: string;
    amount: string;
    date: string;
    by: string;
    status: string;
    actions: string;
  };
  statuses: Record<FeeItemStatus, string>;
  by: { freelance: string; jose: string };
  approve: string;
  approving: string;
  approved: string;
  rejectOpenFor: string;
  rejectOpen: string;
  rejectTitle: string;
  rejectReason: string;
  rejectSubmit: string;
  rejecting: string;
  rejected: string;
  rejectedReason: string;
  delete: string;
  deleteFor: string;
  deleted: string;
  close: string;
  errors: Record<FeeField | FeeErrorCode, string>;
}

export interface FeeTotalsLabels {
  region: string;
  agreed: string;
  pending: string;
  delivered: string;
  approved: string;
  paid: string;
  none: string;
}

export interface FeePanelLabels {
  title: string;
  noFreelance: string;
  noFee: string;
  error: { title: string; text: string };
  summary: Record<FeeMode, string>;
  summaryCap: string;
  settle: string;
  sheet: FeeSheetLabels;
  add: AddItemSheetLabels;
  table: FeeItemTableLabels;
  totals: FeeTotalsLabels;
}

export interface TeamPanelLabels {
  title: string;
  client: string;
  clientNone: string;
  freelance: string;
  freelanceNone: string;
}
