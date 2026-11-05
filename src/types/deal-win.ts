import "@/lib/security/zod-jitless";

import { z } from "zod";

import { ownerRoles, ownerRowSchema } from "./crm";
import type {
  CommissionHeader,
  CommissionLine,
  InvoiceRow,
  PaymentRow,
  ScheduleItem,
} from "./money";

export const ownerRatesSchema = ownerRowSchema.extend({
  role: z.enum(ownerRoles),
  parent_closer_id: z.uuid().nullable(),
  closer_rate: z.number().nullable(),
  parent_rate: z.number().nullable(),
  closer_recurring_rate: z.number().nullable(),
  parent_recurring_rate: z.number().nullable(),
});

export type OwnerRates = z.infer<typeof ownerRatesSchema>;

export const winDealSchema = z.strictObject({
  dealId: z.uuid(),
  wonAmount: z.string().max(40),
  recurringMonthly: z.string().max(40),
});

export const cancelRecurringSchema = z.strictObject({ dealId: z.uuid() });

export type WinDealField = "wonAmount" | "recurringMonthly";

export type WinDealResult =
  | { status: "done" }
  | { status: "invalid"; field: WinDealField }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "already_won" }
  | { status: "lost" }
  | { status: "error" };

export type CancelRecurringResult =
  | { status: "done" }
  | { status: "forbidden" }
  | { status: "not_recurring" }
  | { status: "already_cancelled" }
  | { status: "error" };

export type WinDealHandler = (raw: unknown) => Promise<WinDealResult>;
export type CancelRecurringHandler = (raw: unknown) => Promise<CancelRecurringResult>;

export interface PreviewLine {
  beneficiaryId: string;
  beneficiaryName: string | null;
  role: "closer" | "parent";
  rate: number;
  amountCents: number;
  recurringRate: number | null;
  recurringMonthlyCents: number | null;
}

export type NoCommissionReason = "hiring" | "admin" | "unknown_owner" | "no_rate";

export type CommissionPreview =
  | { status: "none"; reason: NoCommissionReason }
  | { status: "ok"; lines: PreviewLine[]; totalCents: number };

export interface WinPreviewContext {
  via: "hiring" | "freelance" | "project";
  ownerId: string | null;
  people: OwnerRates[];
}

export interface WinSheetLabels {
  open: string;
  openAria: string;
  title: string;
  close: string;
  wonAmount: string;
  wonAmountHint: string;
  recurring: string;
  recurringHint: string;
  optional: string;
  previewTitle: string;
  previewEmpty: string;
  previewLine: string;
  previewParentAnonymous: string;
  previewRecurring: string;
  previewTotal: string;
  freezeNote: string;
  parentRole: string;
  closerRole: string;
  noCommission: Record<NoCommissionReason, string>;
  submit: string;
  saving: string;
  done: string;
  errors: {
    wonAmount: string;
    recurringMonthly: string;
    forbidden: string;
    not_found: string;
    already_won: string;
    lost: string;
    error: string;
  };
}

export interface CancelRecurringLabels {
  open: string;
  openAria: string;
  title: string;
  close: string;
  text: string;
  submit: string;
  saving: string;
  done: string;
  errors: {
    forbidden: string;
    not_recurring: string;
    already_cancelled: string;
    error: string;
  };
}

export interface DealMoneyData {
  commissions: CommissionHeader[];
  lines: CommissionLine[];
  schedule: ScheduleItem[];
  invoices: InvoiceRow[];
  payments: PaymentRow[];
}

export type DealMoneyResult = { status: "ok"; data: DealMoneyData } | { status: "error" };

export interface DealMoneyLabels {
  title: string;
  empty: string;
  emptyText: string;
  dealHeading: string;
  expected: string;
  expectedLine: string;
  expectedNone: string;
  scheduleTitle: string;
  scheduleEmpty: string;
  scheduleColumns: { label: string; amount: string; due: string; status: string };
  scheduleStatuses: Record<ScheduleItem["status"], string>;
  scheduleKinds: Record<ScheduleItem["kind"], string>;
  overdue: string;
  paymentsTitle: string;
  paymentsEmpty: string;
  paymentsColumns: {
    date: string;
    kind: string;
    nature: string;
    amount: string;
    method: string;
    reference: string;
  };
  paymentKinds: Record<PaymentRow["kind"], string>;
  paymentMethods: Record<"transfer" | "card" | "stripe" | "other", string>;
  natures: Record<CommissionLine["nature"], string>;
  linesTitle: string;
  linesEmpty: string;
  linesColumns: {
    date: string;
    beneficiary: string;
    role: string;
    nature: string;
    base: string;
    rate: string;
    amount: string;
    status: string;
  };
  roles: Record<CommissionLine["role"], string>;
  lineStatuses: Record<CommissionLine["status"], string>;
  invoicesTitle: string;
  invoicesEmpty: string;
  invoicesColumns: {
    number: string;
    date: string;
    net: string;
    vat: string;
    gross: string;
    status: string;
  };
  invoiceKinds: Record<InvoiceRow["kind"], string>;
  invoiceStatuses: Record<InvoiceRow["status"], string>;
  loading: string;
  unknownPerson: string;
  tableLabel: string;
  error: { title: string; text: string; retry: string; retrying: string };
}
