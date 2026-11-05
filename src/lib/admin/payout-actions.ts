import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { invoiceFileMaxBytes, parseRate } from "@/lib/admin/payment-actions";
import { isValidPeriod } from "@/lib/crm/payout-periods";
import type { Database } from "@/types/database";
import {
  type BuildErrorCode,
  type BuildPayoutResult,
  buildPayoutSchema,
  issuePayoutSchema,
  type PayoutActionErrorCode,
  type PayoutActionResult,
  type PayoutInvoiceErrorCode,
  type PayoutInvoiceResult,
  payPayoutSchema,
} from "@/types/payouts";

interface RpcFailure {
  code?: string | null;
  message?: string | null;
}

const buildCodes: readonly BuildErrorCode[] = [
  "invalid_beneficiary",
  "invalid_period",
  "invalid_withholding",
  "invalid_note",
  "no_lines_in_period",
  "negative_total",
  "forbidden",
  "error",
];
const actionCodes: readonly PayoutActionErrorCode[] = [
  "invalid_transition",
  "payout_not_draft",
  "payout_not_found",
  "paid_at_required",
  "reference_required",
  "future_date",
  "forbidden",
  "error",
];
const invoiceCodes: readonly PayoutInvoiceErrorCode[] = [
  "invalid_path",
  "payout_not_found",
  "forbidden",
  "error",
];

function mapCode<T extends string>(known: readonly T[], fallback: T, error: RpcFailure): T {
  const match = known.find((code) => code === error.message);
  if (match !== undefined) return match;
  return error.code === "42501" && known.some((code) => code === "forbidden")
    ? ("forbidden" as T)
    : fallback;
}

export async function runBuildPayout(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<BuildPayoutResult> {
  const parsed = buildPayoutSchema.safeParse(raw);
  if (!parsed.success) {
    const head = parsed.error.issues[0]?.path[0];
    if (head === "beneficiaryId") return { status: "invalid", field: "beneficiary" };
    if (head === "withholding") return { status: "invalid", field: "withholding" };
    return { status: "invalid", field: "period" };
  }
  const input = parsed.data;
  if (!isValidPeriod({ start: input.start, end: input.end })) {
    return { status: "invalid", field: "period" };
  }
  const withholding = input.withholding.trim() === "" ? 0 : parseRate(input.withholding);
  if (withholding === null) return { status: "invalid", field: "withholding" };
  try {
    const { data, error } = await client.rpc("build_payout", {
      p_beneficiary_id: input.beneficiaryId,
      p_period_start: input.start,
      p_period_end: input.end,
      p_withholding_rate: withholding,
      p_note: input.note === "" ? undefined : input.note,
    });
    if (error) return { status: "failed", code: mapCode(buildCodes, "error", error) };
    return { status: "done", id: data };
  } catch {
    return { status: "failed", code: "error" };
  }
}

export async function runIssuePayout(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<PayoutActionResult> {
  const parsed = issuePayoutSchema.safeParse(raw);
  if (!parsed.success) return { status: "failed", code: "error" };
  try {
    const { error } = await client.rpc("set_payout_status", {
      p_id: parsed.data.id,
      p_status: "issued",
    });
    return error
      ? { status: "failed", code: mapCode(actionCodes, "error", error) }
      : { status: "done" };
  } catch {
    return { status: "failed", code: "error" };
  }
}

export async function runPayPayout(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<PayoutActionResult> {
  const parsed = payPayoutSchema.safeParse(raw);
  if (!parsed.success) {
    const head = parsed.error.issues[0]?.path[0];
    return { status: "invalid", field: head === "reference" ? "reference" : "date" };
  }
  try {
    const { error } = await client.rpc("set_payout_status", {
      p_id: parsed.data.id,
      p_status: "paid",
      p_paid_at: parsed.data.paidAt,
      p_reference: parsed.data.reference,
    });
    return error
      ? { status: "failed", code: mapCode(actionCodes, "error", error) }
      : { status: "done" };
  } catch {
    return { status: "failed", code: "error" };
  }
}

export async function runDeletePayoutDraft(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<PayoutActionResult> {
  const parsed = issuePayoutSchema.safeParse(raw);
  if (!parsed.success) return { status: "failed", code: "error" };
  try {
    const { error } = await client.rpc("delete_payout_draft", { p_id: parsed.data.id });
    return error
      ? { status: "failed", code: mapCode(actionCodes, "error", error) }
      : { status: "done" };
  } catch {
    return { status: "failed", code: "error" };
  }
}

export interface PayoutUploader {
  upload: (path: string, file: File) => Promise<boolean>;
  remove: (path: string) => Promise<void>;
}

export async function runSetPayoutInvoice(
  client: SupabaseClient<Database>,
  uploader: PayoutUploader | null,
  data: FormData,
): Promise<PayoutInvoiceResult> {
  const id = issuePayoutSchema.safeParse({ id: data.get("id") });
  const file = data.get("file");
  if (!id.success || !(file instanceof File) || file.size === 0) return { status: "invalid" };
  if (file.size > invoiceFileMaxBytes) return { status: "failed", code: "fileSize" };
  const head = await file.slice(0, 5).text();
  if (file.type !== "application/pdf" || head !== "%PDF-") {
    return { status: "failed", code: "fileType" };
  }
  if (uploader === null) return { status: "failed", code: "upload" };
  const path = `payouts/${id.data.id}/${randomUUID()}.pdf`;
  if (!(await uploader.upload(path, file))) return { status: "failed", code: "upload" };
  try {
    const { error } = await client.rpc("set_payout_invoice", { p_id: id.data.id, p_path: path });
    if (!error) return { status: "done" };
    await uploader.remove(path);
    return { status: "failed", code: mapCode(invoiceCodes, "error", error) };
  } catch {
    await uploader.remove(path);
    return { status: "failed", code: "error" };
  }
}
