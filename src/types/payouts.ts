import "@/lib/security/zod-jitless";

import { z } from "zod";

import {
  cents,
  commissionLineSchema,
  payoutCadences,
  type PayoutKind,
  type payoutRowSchema,
  type payoutStatuses,
} from "./money";

export const payoutTabs = ["all", "draft", "issued", "paid"] as const;
export type PayoutTab = (typeof payoutTabs)[number];

export const beneficiarySchema = z.object({
  id: z.uuid(),
  full_name: z.string(),
  role: z.string(),
  is_active: z.boolean(),
  payout_cadence: z.enum(payoutCadences).nullable(),
});

export type Beneficiary = z.infer<typeof beneficiarySchema>;

export const payoutLineSchema = commissionLineSchema.extend({
  payments: z.object({ received_at: z.string() }).nullable(),
  commissions: z
    .object({
      deals: z.object({ contacts: z.object({ full_name: z.string() }).nullable() }).nullable(),
    })
    .nullable(),
});

export type PayoutLine = z.infer<typeof payoutLineSchema>;

export const payoutItemSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  hours: z.number().nullable(),
  amount: cents,
  worked_on: z.string(),
});

export type PayoutItem = z.infer<typeof payoutItemSchema>;

export const previewLineSchema = z.object({
  amount: cents,
  payments: z.object({ received_at: z.string() }).nullable(),
});

export type PayoutsListResult =
  | {
      status: "ok";
      payouts: z.infer<typeof payoutRowSchema>[];
      beneficiaries: Beneficiary[];
      defaultCadence: (typeof payoutCadences)[number];
    }
  | { status: "error" };

export type PayoutDetailResult =
  | {
      status: "ok";
      payout: z.infer<typeof payoutRowSchema>;
      lines: PayoutLine[];
      items: PayoutItem[];
      beneficiary: string;
    }
  | { status: "missing" }
  | { status: "error" };

export const buildPayoutSchema = z.strictObject({
  beneficiaryId: z.uuid(),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  withholding: z.string().max(10),
  note: z.string().trim().max(1000),
});

export const previewPayoutSchema = z.strictObject({
  beneficiaryId: z.uuid(),
  role: z.enum(["closer", "freelance"]).default("closer"),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const issuePayoutSchema = z.strictObject({ id: z.uuid() });

export const payPayoutSchema = z.strictObject({
  id: z.uuid(),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reference: z.string().trim().min(1).max(200),
});

export type BuildErrorCode =
  | "invalid_beneficiary"
  | "invalid_period"
  | "invalid_withholding"
  | "invalid_note"
  | "no_lines_in_period"
  | "negative_total"
  | "forbidden"
  | "error";

export type BuildPayoutResult =
  | { status: "done"; id: string }
  | { status: "invalid"; field: "beneficiary" | "period" | "withholding" }
  | { status: "failed"; code: BuildErrorCode };

export type PreviewPayoutResult =
  { status: "ok"; count: number; totalCents: number } | { status: "error" };

export type PayoutActionErrorCode =
  | "invalid_transition"
  | "payout_not_draft"
  | "payout_not_found"
  | "paid_at_required"
  | "reference_required"
  | "future_date"
  | "forbidden"
  | "error";

export type PayoutActionResult =
  | { status: "done" }
  | { status: "invalid"; field: "date" | "reference" }
  | { status: "failed"; code: PayoutActionErrorCode };

export type PayoutInvoiceErrorCode =
  "fileType" | "fileSize" | "upload" | "invalid_path" | "payout_not_found" | "forbidden" | "error";

export type PayoutInvoiceResult =
  { status: "done" } | { status: "invalid" } | { status: "failed"; code: PayoutInvoiceErrorCode };

export type BuildPayoutHandler = (raw: unknown) => Promise<BuildPayoutResult>;
export type PreviewPayoutHandler = (raw: unknown) => Promise<PreviewPayoutResult>;
export type PayoutActionHandler = (raw: unknown) => Promise<PayoutActionResult>;
export type PayoutInvoiceHandler = (data: FormData) => Promise<PayoutInvoiceResult>;

export interface PayoutListLabels {
  caption: string;
  region: string;
  columns: {
    beneficiary: string;
    period: string;
    cadence: string;
    total: string;
    withholding: string;
    net: string;
    status: string;
    reference: string;
    actions: string;
    kind: string;
  };
  open: string;
  openAria: string;
  range: string;
  none: string;
  kinds: Record<PayoutKind, string>;
  cadences: Record<(typeof payoutCadences)[number], string>;
  statuses: Record<(typeof payoutStatuses)[number], string>;
}

export interface PayoutBuilderLabels {
  roles: Record<"closer" | "freelance", string>;
  open: string;
  title: string;
  close: string;
  beneficiary: string;
  placeholder: string;
  start: string;
  end: string;
  suggested: string;
  withholding: string;
  withholdingHint: string;
  note: string;
  optional: string;
  previewTitle: string;
  previewCount: string;
  previewTotal: string;
  previewEmpty: string;
  previewLoading: string;
  submit: string;
  saving: string;
  done: string;
  cadences: Record<(typeof payoutCadences)[number], string>;
  errors: Record<"beneficiary" | "period" | "withholding" | BuildErrorCode, string>;
}

export interface PayoutActionsLabels {
  title: string;
  issue: string;
  issueSaving: string;
  issueDone: string;
  markPaid: string;
  deleteDraft: string;
  errors: Record<PayoutActionErrorCode, string>;
  pay: {
    title: string;
    close: string;
    text: string;
    date: string;
    reference: string;
    submit: string;
    saving: string;
    done: string;
    errors: Record<"date" | "reference" | PayoutActionErrorCode, string>;
  };
  deleteConfirm: {
    title: string;
    text: string;
    submit: string;
    done: string;
    saving: string;
    close: string;
  };
}

export interface PayoutInvoiceLabels {
  title: string;
  none: string;
  open: string;
  upload: string;
  file: string;
  hint: string;
  submit: string;
  saving: string;
  done: string;
  errors: Record<"file" | PayoutInvoiceErrorCode, string>;
}

export interface StatementLabels {
  print: string;
  printHint: string;
  title: string;
  issuer: string;
  beneficiary: string;
  period: string;
  range: string;
  notPayment: string;
  footer: string;
  summary: string;
  cadence: string;
  total: string;
  withholding: string;
  net: string;
  status: string;
  issuedAt: string;
  paidAt: string;
  reference: string;
  note: string;
  linesTitle: string;
  linesEmpty: string;
  linesCaption: string;
  linesRegion: string;
  linesColumns: {
    date: string;
    contact: string;
    nature: string;
    base: string;
    rate: string;
    amount: string;
  };
  items: {
    statementTitle: string;
    title: string;
    empty: string;
    caption: string;
    region: string;
    columns: { date: string; label: string; hours: string; amount: string };
    notInvoice: string;
  };
  cadences: Record<(typeof payoutCadences)[number], string>;
  statuses: Record<(typeof payoutStatuses)[number], string>;
  natures: Record<"project" | "recurring", string>;
}
