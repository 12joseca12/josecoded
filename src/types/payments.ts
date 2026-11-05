import "@/lib/security/zod-jitless";

import { z } from "zod";

import {
  cents,
  commissionNatures,
  invoiceKinds,
  invoiceStatuses,
  paymentKinds,
  paymentMethods,
  scheduleKinds,
  scheduleStatuses,
} from "./money";

export const paymentTabs = ["pending", "overdue", "paid", "proformas", "invoices"] as const;
export type PaymentTab = (typeof paymentTabs)[number];

const contactRef = z.object({ full_name: z.string() });
const dealRef = z.object({ contacts: contactRef.nullable() });

export const receivableRowSchema = z.object({
  id: z.uuid(),
  deal_id: z.uuid(),
  label: z.string(),
  kind: z.enum(scheduleKinds),
  percent: z.number().nullable(),
  amount: cents,
  due_at: z.string().nullable(),
  status: z.enum(scheduleStatuses),
  sort: z.number(),
  deals: dealRef.nullable(),
});

export type ReceivableRow = z.infer<typeof receivableRowSchema>;

export const documentRowSchema = z.object({
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
  deals: dealRef.nullable(),
});

export type DocumentRow = z.infer<typeof documentRowSchema>;

export const wonDealSchema = z.object({
  id: z.uuid(),
  won_amount: cents.nullable().optional(),
  recurring_monthly: z.number().nullable(),
  contacts: contactRef.nullable(),
});

export type WonDeal = z.infer<typeof wonDealSchema>;

export const paymentSumSchema = z.object({
  schedule_id: z.uuid().nullable(),
  kind: z.enum(paymentKinds),
  amount_net: cents,
});

export type ReceivablesResult =
  | {
      status: "ok";
      deals: WonDeal[];
      schedule: ReceivableRow[];
      documents: DocumentRow[];
      paidBySchedule: Record<string, number>;
      vatRate: number;
    }
  | { status: "error" };

export const recordPaymentSchema = z.strictObject({
  dealId: z.uuid(),
  scheduleId: z.union([z.literal(""), z.uuid()]),
  invoiceId: z.union([z.literal(""), z.uuid()]),
  kind: z.enum(paymentKinds),
  nature: z.enum(commissionNatures),
  amount: z.string().max(40),
  receivedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  method: z.enum(paymentMethods),
  reference: z.string().trim().max(200),
});

export const scheduleItemInputSchema = z.strictObject({
  label: z.string().trim().min(1).max(120),
  kind: z.enum(scheduleKinds),
  percent: z.string().max(10),
  amount: z.string().max(40),
  dueAt: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
});

export const setScheduleSchema = z.strictObject({
  dealId: z.uuid(),
  items: z.array(scheduleItemInputSchema).min(1).max(24),
});

export const issueProformaSchema = z.strictObject({
  scheduleId: z.uuid(),
  vat: z.string().max(10),
});

export const recordInvoiceFieldsSchema = z.strictObject({
  dealId: z.uuid(),
  scheduleId: z.union([z.literal(""), z.uuid()]),
  number: z.string().trim().min(1).max(60),
  issuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  net: z.string().max(40),
  vat: z.string().max(10),
});

export const idSchema = z.strictObject({ id: z.uuid() });

export type RecordPaymentErrorCode =
  | "future_date"
  | "payment_exceeds_schedule"
  | "payment_exceeds_deal"
  | "refund_exceeds_paid"
  | "no_recurring"
  | "nature_mismatch"
  | "schedule_cancelled"
  | "schedule_mismatch"
  | "invoice_mismatch"
  | "invoice_void"
  | "deal_not_won"
  | "invalid_payment"
  | "forbidden"
  | "error";

export type RecordPaymentResult =
  | { status: "done" }
  | { status: "invalid"; field: "deal" | "amount" | "date" }
  | { status: "failed"; code: RecordPaymentErrorCode };

export type ScheduleErrorCode =
  "schedule_total_mismatch" | "invalid_schedule" | "deal_not_won" | "forbidden" | "error";

export type SetScheduleResult =
  | { status: "done" }
  | { status: "invalid"; field: "deal" | "items" }
  | { status: "failed"; code: ScheduleErrorCode };

export type ProformaErrorCode =
  | "proforma_already_issued"
  | "schedule_not_issuable"
  | "schedule_not_found"
  | "forbidden"
  | "error";

export type IssueProformaResult =
  | { status: "done"; number: string; id: string }
  | { status: "invalid" }
  | { status: "failed"; code: ProformaErrorCode };

export type InvoiceErrorCode =
  | "invoice_number_reserved"
  | "invoice_number_taken"
  | "invalid_invoice"
  | "schedule_mismatch"
  | "schedule_cancelled"
  | "upload"
  | "fileType"
  | "fileSize"
  | "forbidden"
  | "error";

export type RecordInvoiceResult =
  | { status: "done" }
  | { status: "invalid"; field: "number" | "date" | "net" | "vat" }
  | { status: "failed"; code: InvoiceErrorCode };

export type ConfirmErrorCode =
  | "schedule_has_payments"
  | "schedule_has_invoice"
  | "invoice_has_payments"
  | "invoice_not_voidable"
  | "forbidden"
  | "error";

export type ConfirmResult = { status: "done" } | { status: "failed"; code: ConfirmErrorCode };

export type RecordPaymentHandler = (raw: unknown) => Promise<RecordPaymentResult>;
export type SetScheduleHandler = (raw: unknown) => Promise<SetScheduleResult>;
export type IssueProformaHandler = (raw: unknown) => Promise<IssueProformaResult>;
export type RecordInvoiceHandler = (data: FormData) => Promise<RecordInvoiceResult>;
export type ConfirmHandler = (raw: unknown) => Promise<ConfirmResult>;

export interface ReceivableTableLabels {
  caption: string;
  region: string;
  columns: {
    contact: string;
    label: string;
    amount: string;
    paid: string;
    due: string;
    status: string;
    actions: string;
  };
  paidOf: string;
  noDue: string;
  overdue: string;
  statuses: Record<(typeof scheduleStatuses)[number], string>;
  kinds: Record<(typeof scheduleKinds)[number], string>;
}

export interface ReceivableActionLabels {
  collect: string;
  collectAria: string;
  proforma: string;
  proformaAria: string;
  invoice: string;
  invoiceAria: string;
  cancel: string;
  cancelAria: string;
}

export interface DocumentTableLabels {
  caption: string;
  region: string;
  columns: {
    contact: string;
    number: string;
    date: string;
    net: string;
    vat: string;
    gross: string;
    status: string;
    actions: string;
  };
  kinds: Record<(typeof invoiceKinds)[number], string>;
  statuses: Record<(typeof invoiceStatuses)[number], string>;
  pdf: string;
  pdfAria: string;
  print: string;
  printAria: string;
  void: string;
  voidAria: string;
}

export interface RecordPaymentLabels {
  open: string;
  title: string;
  close: string;
  deal: string;
  dealPlaceholder: string;
  schedule: string;
  noSchedule: string;
  kind: string;
  nature: string;
  amount: string;
  amountHint: string;
  date: string;
  method: string;
  reference: string;
  invoice: string;
  noInvoice: string;
  optional: string;
  kinds: Record<(typeof paymentKinds)[number], string>;
  natures: Record<(typeof commissionNatures)[number], string>;
  methods: Record<(typeof paymentMethods)[number], string>;
  submit: string;
  saving: string;
  done: string;
  errors: Record<"deal" | "amount" | "date" | RecordPaymentErrorCode, string>;
}

export interface ScheduleSheetLabels {
  open: string;
  title: string;
  close: string;
  deal: string;
  dealPlaceholder: string;
  won: string;
  templates: string;
  template442: string;
  templateSingle: string;
  items: string;
  label: string;
  kind: string;
  kinds: Record<(typeof scheduleKinds)[number], string>;
  percent: string;
  amount: string;
  due: string;
  add: string;
  remove: string;
  removeAria: string;
  sum: string;
  sumOk: string;
  defaults: { first: string; second: string; last: string; single: string; next: string };
  replaceNote: string;
  submit: string;
  saving: string;
  done: string;
  errors: Record<"deal" | "items" | ScheduleErrorCode, string>;
}

export interface ProformaSheetLabels {
  title: string;
  close: string;
  text: string;
  vat: string;
  vatHint: string;
  submit: string;
  saving: string;
  done: string;
  view: string;
  errors: Record<"vat" | ProformaErrorCode, string>;
}

export interface InvoiceSheetLabels {
  title: string;
  close: string;
  text: string;
  number: string;
  date: string;
  net: string;
  vat: string;
  file: string;
  fileHint: string;
  optional: string;
  submit: string;
  saving: string;
  done: string;
  errors: Record<"number" | "date" | "net" | "vat" | InvoiceErrorCode, string>;
}

export interface ConfirmLabels {
  cancelTitle: string;
  cancelText: string;
  cancelSubmit: string;
  cancelDone: string;
  voidTitle: string;
  voidText: string;
  voidSubmit: string;
  voidDone: string;
  saving: string;
  close: string;
  errors: Record<ConfirmErrorCode, string>;
}

export interface PaymentsPageHandlers {
  record: RecordPaymentHandler;
  schedule: SetScheduleHandler;
  proforma: IssueProformaHandler;
  invoice: RecordInvoiceHandler;
  cancelItem: ConfirmHandler;
  voidInvoice: ConfirmHandler;
}
