import "@/lib/security/zod-jitless";

import { z } from "zod";

import { toCents } from "@/lib/money";

export const feeModes = ["hourly", "milestones", "fixed"] as const;
export type FeeMode = (typeof feeModes)[number];

export const feeItemStatuses = ["pending", "delivered", "approved", "rejected", "paid"] as const;
export type FeeItemStatus = (typeof feeItemStatuses)[number];

const euros = z.number().transform((value) => toCents(value));
const nullableEuros = euros.nullable();

export const feeSummarySchema = z.object({
  fee_id: z.uuid(),
  project_id: z.uuid(),
  project_name: z.string(),
  project_archived_at: z.string().nullable(),
  mode: z.enum(feeModes),
  amount: nullableEuros,
  hourly_rate: nullableEuros,
  hours_cap: z.number().nullable(),
  closed_at: z.string().nullable(),
  agreed_total: nullableEuros,
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
  payout_id: z.uuid().nullable(),
  created_at: z.string(),
});
export type FeeItem = z.infer<typeof feeItemSchema>;

export const countersSchema = z.object({
  projects_active: z.number().optional(),
  tasks_pending: z.number().optional(),
  fees_pending_amount: euros.optional(),
  fees_owed_amount: euros.optional(),
  fees_paid_amount: euros.optional(),
  fees_paid_year_amount: euros.optional(),
  last_paid_at: z.string().nullable().optional(),
  items_to_deliver: z.number().optional(),
  unread_threads: z.number().optional(),
});
export type FreelanceCounters = z.infer<typeof countersSchema>;

export const freelancePayoutSchema = z.object({
  id: z.uuid(),
  period_start: z.string(),
  period_end: z.string(),
  total: euros,
  withholding_rate: z.number(),
  net_total: euros,
  status: z.enum(["issued", "paid"]),
  issued_at: z.string().nullable(),
  paid_at: z.string().nullable(),
  paid_reference: z.string().nullable(),
  statement_note: z.string().nullable(),
});
export type FreelancePayout = z.infer<typeof freelancePayoutSchema>;

export const hoursMax = 24;
export const labelMax = 120;

export const hoursInputSchema = z.strictObject({
  projectId: z.uuid(),
  hours: z
    .string()
    .trim()
    .transform((value) => Number(value.replace(",", ".")))
    .pipe(
      z
        .number()
        .gt(0)
        .max(hoursMax)
        .refine((value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-9),
    ),
  label: z.string().trim().min(1).max(labelMax),
  workedOn: z.union([z.iso.date(), z.literal("")]).transform((value) => value || null),
});
export type HoursInput = z.input<typeof hoursInputSchema>;

export const feeErrorCodes = [
  "hours_cap_exceeded",
  "future_date",
  "invalid_hours",
  "fee_not_found",
  "fee_mode_mismatch",
  "fee_closed",
  "item_not_pending",
  "forbidden",
  "error",
] as const;
export type FeeErrorCode = (typeof feeErrorCodes)[number];

export type FeeResult =
  | { status: "done" }
  | { status: "invalid"; field: "hours" | "label" | "workedOn" }
  | { status: "error"; code: FeeErrorCode };

export type HoursHandler = (raw: HoursInput) => Promise<FeeResult>;
export type ItemHandler = (id: string) => Promise<FeeResult>;

export interface FeeCardLabels {
  title: string;
  modes: Record<FeeMode, string>;
  hourly: string;
  hourlyCap: string;
  fixed: string;
  milestones: string;
  owed: string;
  none: string;
  itemsTitle: string;
  noItems: string;
  statuses: Record<FeeItemStatus, string>;
  hoursOf: string;
  rejectedReason: string;
  deliver: string;
  delivering: string;
  delivered: string;
  deleteItem: string;
  deleteFor: string;
  deleting: string;
  deletedItem: string;
  closedNote: string;
  errors: Record<FeeErrorCode | "hours" | "label" | "workedOn", string>;
  form: {
    title: string;
    hours: string;
    hoursHint: string;
    label: string;
    labelHint: string;
    date: string;
    submit: string;
    submitting: string;
    done: string;
  };
}
