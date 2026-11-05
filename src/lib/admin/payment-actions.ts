import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { fromCents, parseMoneyToCents } from "@/lib/money";
import type { Database } from "@/types/database";
import {
  type ConfirmErrorCode,
  type ConfirmResult,
  idSchema,
  type InvoiceErrorCode,
  type IssueProformaResult,
  issueProformaSchema,
  type ProformaErrorCode,
  recordInvoiceFieldsSchema,
  type RecordInvoiceResult,
  type RecordPaymentErrorCode,
  type RecordPaymentResult,
  recordPaymentSchema,
  type ScheduleErrorCode,
  type SetScheduleResult,
  setScheduleSchema,
} from "@/types/payments";

export const invoiceFileMaxBytes = 10 * 1024 * 1024;

interface RpcFailure {
  code?: string | null;
  message?: string | null;
}

function mapCode<T extends string>(known: readonly T[], fallback: T, error: RpcFailure): T {
  const message = error.message ?? "";
  const match = known.find((code) => code === message);
  if (match !== undefined) return match;
  if (error.code === "42501" && known.some((code) => code === "forbidden")) {
    return "forbidden" as T;
  }
  return fallback;
}

const paymentCodes: readonly RecordPaymentErrorCode[] = [
  "future_date",
  "payment_exceeds_schedule",
  "payment_exceeds_deal",
  "refund_exceeds_paid",
  "no_recurring",
  "nature_mismatch",
  "schedule_cancelled",
  "schedule_mismatch",
  "invoice_mismatch",
  "invoice_void",
  "deal_not_won",
  "invalid_payment",
  "forbidden",
  "error",
];
const scheduleCodes: readonly ScheduleErrorCode[] = [
  "schedule_total_mismatch",
  "invalid_schedule",
  "deal_not_won",
  "forbidden",
  "error",
];
const proformaCodes: readonly ProformaErrorCode[] = [
  "proforma_already_issued",
  "schedule_not_issuable",
  "schedule_not_found",
  "forbidden",
  "error",
];
const invoiceCodes: readonly InvoiceErrorCode[] = [
  "invoice_number_reserved",
  "invoice_number_taken",
  "invalid_invoice",
  "schedule_mismatch",
  "schedule_cancelled",
  "forbidden",
  "error",
];
const confirmCodes: readonly ConfirmErrorCode[] = [
  "schedule_has_payments",
  "schedule_has_invoice",
  "invoice_has_payments",
  "invoice_not_voidable",
  "forbidden",
  "error",
];

export function parseRate(text: string): number | null {
  const cleaned = text.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value >= 0 && value <= 100 ? value : null;
}

export async function runRecordPayment(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<RecordPaymentResult> {
  const parsed = recordPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    const head = parsed.error.issues[0]?.path[0];
    if (head === "dealId") return { status: "invalid", field: "deal" };
    if (head === "receivedAt") return { status: "invalid", field: "date" };
    return { status: "invalid", field: "amount" };
  }
  const input = parsed.data;
  const cents = parseMoneyToCents(input.amount);
  if (cents === null || cents <= 0) return { status: "invalid", field: "amount" };
  try {
    const { error } = await client.rpc("record_payment", {
      p_deal_id: input.dealId,
      p_kind: input.kind,
      p_nature: input.nature,
      p_amount_net: fromCents(cents),
      p_received_at: input.receivedAt,
      p_method: input.method,
      p_schedule_id: input.scheduleId === "" ? undefined : input.scheduleId,
      p_invoice_id: input.invoiceId === "" ? undefined : input.invoiceId,
      p_reference: input.reference === "" ? undefined : input.reference,
    });
    if (!error) return { status: "done" };
    return { status: "failed", code: mapCode(paymentCodes, "error", error) };
  } catch {
    return { status: "failed", code: "error" };
  }
}

export async function runSetSchedule(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<SetScheduleResult> {
  const parsed = setScheduleSchema.safeParse(raw);
  if (!parsed.success) {
    const head = parsed.error.issues[0]?.path[0];
    return { status: "invalid", field: head === "dealId" ? "deal" : "items" };
  }
  const items = [];
  for (const item of parsed.data.items) {
    const cents = parseMoneyToCents(item.amount);
    if (cents === null || cents <= 0) return { status: "invalid", field: "items" };
    const percent = item.percent.trim() === "" ? null : parseRate(item.percent);
    if (item.percent.trim() !== "" && percent === null)
      return { status: "invalid", field: "items" };
    items.push({
      label: item.label,
      kind: item.kind,
      percent,
      amount: fromCents(cents),
      due_at: item.dueAt === "" ? null : item.dueAt,
    });
  }
  try {
    const { error } = await client.rpc("set_payment_schedule", {
      p_deal_id: parsed.data.dealId,
      p_items: items,
    });
    if (!error) return { status: "done" };
    return { status: "failed", code: mapCode(scheduleCodes, "error", error) };
  } catch {
    return { status: "failed", code: "error" };
  }
}

export async function runIssueProforma(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<IssueProformaResult> {
  const parsed = issueProformaSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid" };
  const vat = parseRate(parsed.data.vat);
  if (vat === null) return { status: "invalid" };
  try {
    const { data, error } = await client.rpc("issue_proforma", {
      p_schedule_id: parsed.data.scheduleId,
      p_vat_rate: vat,
    });
    if (error) return { status: "failed", code: mapCode(proformaCodes, "error", error) };
    const read = await client.from("invoices").select("number").eq("id", data).maybeSingle();
    return { status: "done", id: data, number: read.data?.number ?? "" };
  } catch {
    return { status: "failed", code: "error" };
  }
}

export interface InvoiceUploader {
  upload: (path: string, file: File) => Promise<boolean>;
  remove: (path: string) => Promise<void>;
}

async function looksLikePdf(file: File): Promise<boolean> {
  const head = await file.slice(0, 5).text();
  return head === "%PDF-";
}

export async function runRecordInvoice(
  client: SupabaseClient<Database>,
  uploader: InvoiceUploader | null,
  data: FormData,
): Promise<RecordInvoiceResult> {
  const fields = recordInvoiceFieldsSchema.safeParse({
    dealId: data.get("dealId"),
    scheduleId: data.get("scheduleId") ?? "",
    number: data.get("number"),
    issuedAt: data.get("issuedAt"),
    net: data.get("net"),
    vat: data.get("vat"),
  });
  if (!fields.success) {
    const head = fields.error.issues[0]?.path[0];
    if (head === "number") return { status: "invalid", field: "number" };
    if (head === "issuedAt") return { status: "invalid", field: "date" };
    if (head === "vat") return { status: "invalid", field: "vat" };
    return { status: "invalid", field: "net" };
  }
  const input = fields.data;
  const cents = parseMoneyToCents(input.net);
  if (cents === null || cents <= 0) return { status: "invalid", field: "net" };
  const vat = parseRate(input.vat);
  if (vat === null) return { status: "invalid", field: "vat" };

  const file = data.get("file");
  const hasFile = file instanceof File && file.size > 0;
  let path: string | undefined;
  if (hasFile) {
    if (file.size > invoiceFileMaxBytes) return { status: "failed", code: "fileSize" };
    if (file.type !== "application/pdf" || !(await looksLikePdf(file))) {
      return { status: "failed", code: "fileType" };
    }
    if (uploader === null) return { status: "failed", code: "upload" };
    path = `${input.dealId}/${randomUUID()}.pdf`;
    if (!(await uploader.upload(path, file))) return { status: "failed", code: "upload" };
  }

  try {
    const { error } = await client.rpc("record_invoice", {
      p_deal_id: input.dealId,
      p_number: input.number,
      p_issued_at: input.issuedAt,
      p_net: fromCents(cents),
      p_vat_rate: vat,
      p_schedule_id: input.scheduleId === "" ? undefined : input.scheduleId,
      p_pdf_path: path,
    });
    if (!error) return { status: "done" };
    if (path !== undefined && uploader !== null) await uploader.remove(path);
    return { status: "failed", code: mapCode(invoiceCodes, "error", error) };
  } catch {
    if (path !== undefined && uploader !== null) await uploader.remove(path);
    return { status: "failed", code: "error" };
  }
}

export async function runCancelItem(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<ConfirmResult> {
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return { status: "failed", code: "error" };
  try {
    const { error } = await client.rpc("cancel_schedule_item", { p_id: parsed.data.id });
    if (!error) return { status: "done" };
    return { status: "failed", code: mapCode(confirmCodes, "error", error) };
  } catch {
    return { status: "failed", code: "error" };
  }
}

export async function runVoidInvoice(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<ConfirmResult> {
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return { status: "failed", code: "error" };
  try {
    const { error } = await client.rpc("void_invoice", { p_id: parsed.data.id });
    if (!error) return { status: "done" };
    return { status: "failed", code: mapCode(confirmCodes, "error", error) };
  } catch {
    return { status: "failed", code: "error" };
  }
}
