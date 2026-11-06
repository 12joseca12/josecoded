import "@/lib/security/zod-jitless";

import { z } from "zod";

import { toCents } from "@/lib/money";

const cents = z.number().transform(toCents);
const nullableCents = z
  .number()
  .nullable()
  .transform((value) => (value === null ? null : toCents(value)));

export const commissionRoles = ["closer", "parent"] as const;
export const commissionNatures = ["project", "recurring"] as const;
export const commissionLineStatuses = [
  "accrued",
  "approved",
  "rejected",
  "paid",
  "reversed",
] as const;
export const scheduleKinds = ["milestone", "recurring"] as const;
export const scheduleStatuses = [
  "scheduled",
  "proforma_sent",
  "invoiced",
  "paid",
  "cancelled",
] as const;
export const invoiceKinds = ["proforma", "invoice"] as const;
export const invoiceStatuses = ["draft", "sent", "paid", "void"] as const;
export const paymentKinds = ["payment", "refund"] as const;
export const paymentMethods = ["transfer", "card", "stripe", "other"] as const;
export const payoutStatuses = ["draft", "issued", "paid"] as const;
export const payoutKinds = ["commission", "freelance"] as const;
export const payoutCadences = ["per_payment", "weekly", "biweekly"] as const;

export type CommissionRole = (typeof commissionRoles)[number];
export type CommissionNature = (typeof commissionNatures)[number];
export type CommissionLineStatus = (typeof commissionLineStatuses)[number];
export type ScheduleKind = (typeof scheduleKinds)[number];
export type ScheduleStatus = (typeof scheduleStatuses)[number];
export type InvoiceKind = (typeof invoiceKinds)[number];
export type InvoiceStatus = (typeof invoiceStatuses)[number];
export type PaymentKind = (typeof paymentKinds)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type PayoutStatus = (typeof payoutStatuses)[number];
export type PayoutKind = (typeof payoutKinds)[number];
export type PayoutCadence = (typeof payoutCadences)[number];

export const commissionHeaderSchema = z.object({
  id: z.uuid(),
  deal_id: z.uuid(),
  closer_id: z.uuid(),
  closer_rate: z.number(),
  closer_recurring_rate: z.number().nullable(),
  subcloser_id: z.uuid().nullable(),
  subcloser_rate: z.number().nullable(),
  subcloser_recurring_rate: z.number().nullable(),
  expected_base: cents,
  expected_closer_amount: cents,
  expected_subcloser_amount: cents,
});

export type CommissionHeader = z.infer<typeof commissionHeaderSchema>;

export const commissionLineSchema = z.object({
  id: z.uuid(),
  commission_id: z.uuid(),
  payment_id: z.uuid().nullable(),
  payout_id: z.uuid().nullable(),
  beneficiary_id: z.uuid(),
  role: z.enum(commissionRoles),
  nature: z.enum(commissionNatures),
  rate: z.number(),
  base: cents,
  amount: cents,
  status: z.enum(commissionLineStatuses),
  rejected_reason: z.string().nullable(),
  created_at: z.string(),
});

export type CommissionLine = z.infer<typeof commissionLineSchema>;

export const scheduleItemSchema = z.object({
  id: z.uuid(),
  deal_id: z.uuid(),
  label: z.string(),
  kind: z.enum(scheduleKinds),
  percent: z.number().nullable(),
  amount: cents,
  due_at: z.string().nullable(),
  status: z.enum(scheduleStatuses),
  sort: z.number(),
});

export type ScheduleItem = z.infer<typeof scheduleItemSchema>;

export const invoiceRowSchema = z.object({
  id: z.uuid(),
  deal_id: z.uuid(),
  schedule_id: z.uuid().nullable(),
  kind: z.enum(invoiceKinds),
  number: z.string(),
  issued_at: z.string(),
  amount_net: cents,
  vat_rate: z.number(),
  vat_amount: cents,
  amount_gross: cents,
  pdf_path: z.string().nullable(),
  status: z.enum(invoiceStatuses),
});

export type InvoiceRow = z.infer<typeof invoiceRowSchema>;

export const paymentRowSchema = z.object({
  id: z.uuid(),
  schedule_id: z.uuid().nullable(),
  kind: z.enum(paymentKinds),
  nature: z.enum(commissionNatures),
  amount_net: cents,
  received_at: z.string(),
  method: z.enum(paymentMethods).nullable(),
  reference: z.string().nullable(),
});

export type PaymentRow = z.infer<typeof paymentRowSchema> & { deal_id: string };

export const payoutRowSchema = z.object({
  id: z.uuid(),
  beneficiary_id: z.uuid(),
  period_start: z.string(),
  period_end: z.string(),
  cadence: z.enum(payoutCadences),
  total: cents,
  withholding_rate: z.number(),
  net_total: cents,
  status: z.enum(payoutStatuses),
  statement_note: z.string().nullable(),
  closer_invoice_path: z.string().nullable(),
  issued_at: z.string().nullable(),
  paid_at: z.string().nullable(),
  paid_reference: z.string().nullable(),
  kind: z.enum(payoutKinds).default("commission"),
});

export type PayoutRow = z.infer<typeof payoutRowSchema>;

export { cents, nullableCents };
