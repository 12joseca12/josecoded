import { z } from "zod";

import type { ServerSupabase } from "@/lib/supabase/server";
import {
  countersSchema,
  type FeeErrorCode,
  feeErrorCodes,
  type FeeItem,
  feeItemSchema,
  type FeeResult,
  type FeeSummary,
  feeSummarySchema,
  type FreelanceCounters,
  type FreelancePayout,
  freelancePayoutSchema,
  hoursInputSchema,
} from "@/types/freelance-fees";

export type Loaded<T> = { status: "ok"; data: T } | { status: "error" };

const summaryColumns =
  "fee_id, project_id, project_name, project_archived_at, mode, amount, hourly_rate, hours_cap, closed_at, agreed_total, hours_approved, pending_amount, delivered_amount, approved_unpaid_amount, paid_amount";
const itemColumns =
  "id, fee_id, label, hours, amount, worked_on, status, rejected_reason, payout_id, created_at";
const payoutColumns =
  "id, period_start, period_end, total, withholding_rate, net_total, status, issued_at, paid_at, paid_reference, statement_note";
const known = new Set<string>(feeErrorCodes);
const idSchema = z.uuid();

export function mapFeeError(error: { code?: string | null; message?: string | null }): FeeResult {
  if (error.code === "42501") return { status: "error", code: "forbidden" };
  const message = error.message ?? "";
  const code: FeeErrorCode = known.has(message) ? (message as FeeErrorCode) : "error";
  return { status: "error", code };
}

export function owedOf(summaries: readonly FeeSummary[]): number {
  return summaries.reduce((total, entry) => total + entry.approved_unpaid_amount, 0);
}

export function activeFee(summaries: readonly FeeSummary[]): FeeSummary | undefined {
  return summaries.find((entry) => entry.closed_at === null) ?? summaries[0];
}

export async function fetchFeeSummaries(
  client: ServerSupabase,
  projectId?: string,
): Promise<Loaded<FeeSummary[]>> {
  const base = client.from("freelance_fee_summary").select(summaryColumns);
  const { data, error } = await (projectId ? base.eq("project_id", projectId) : base);
  if (error) return { status: "error" };
  const parsed = z.array(feeSummarySchema).safeParse(data);
  return parsed.success ? { status: "ok", data: parsed.data } : { status: "error" };
}

export async function fetchFeeItems(
  client: ServerSupabase,
  feeIds?: readonly string[],
): Promise<Loaded<FeeItem[]>> {
  const base = client.from("freelance_fee_items").select(itemColumns);
  const { data, error } = await (feeIds ? base.in("fee_id", [...feeIds]) : base).order(
    "worked_on",
    { ascending: false },
  );
  if (error) return { status: "error" };
  const parsed = z.array(feeItemSchema).safeParse(data);
  return parsed.success ? { status: "ok", data: parsed.data } : { status: "error" };
}

export async function fetchCounters(client: ServerSupabase): Promise<Loaded<FreelanceCounters>> {
  const { data, error } = await client.rpc("freelance_counters");
  if (error) return { status: "error" };
  const parsed = countersSchema.safeParse(data);
  return parsed.success ? { status: "ok", data: parsed.data } : { status: "error" };
}

export async function fetchPayouts(client: ServerSupabase): Promise<Loaded<FreelancePayout[]>> {
  const { data, error } = await client
    .from("payouts")
    .select(payoutColumns)
    .eq("kind", "freelance")
    .order("period_end", { ascending: false });
  if (error) return { status: "error" };
  const parsed = z.array(freelancePayoutSchema).safeParse(data);
  return parsed.success ? { status: "ok", data: parsed.data } : { status: "error" };
}

export type PayoutDetail =
  | { status: "ok"; payout: FreelancePayout; items: FeeItem[] }
  | { status: "missing" }
  | { status: "error" };

export async function fetchPayoutDetail(client: ServerSupabase, id: string): Promise<PayoutDetail> {
  if (!idSchema.safeParse(id).success) return { status: "missing" };
  const { data, error } = await client
    .from("payouts")
    .select(payoutColumns)
    .eq("kind", "freelance")
    .eq("id", id)
    .limit(1);
  if (error) return { status: "error" };
  if (data.length === 0) return { status: "missing" };
  const payout = freelancePayoutSchema.safeParse(data[0]);
  if (!payout.success) return { status: "error" };
  const items = await client
    .from("freelance_fee_items")
    .select(itemColumns)
    .eq("payout_id", id)
    .order("worked_on");
  if (items.error) return { status: "error" };
  const parsed = z.array(feeItemSchema).safeParse(items.data);
  return parsed.success
    ? { status: "ok", payout: payout.data, items: parsed.data }
    : { status: "error" };
}

export async function submitHours(client: ServerSupabase, raw: unknown): Promise<FeeResult> {
  const parsed = hoursInputSchema.safeParse(raw);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return {
      status: "invalid",
      field: field === "label" ? "label" : field === "workedOn" ? "workedOn" : "hours",
    };
  }
  const { error } = await client.rpc("submit_fee_hours", {
    p_project_id: parsed.data.projectId,
    p_hours: parsed.data.hours,
    p_label: parsed.data.label,
    ...(parsed.data.workedOn === null ? {} : { p_worked_on: parsed.data.workedOn }),
  });
  return error ? mapFeeError(error) : { status: "done" };
}

export async function markDelivered(client: ServerSupabase, id: string): Promise<FeeResult> {
  if (!idSchema.safeParse(id).success) return { status: "error", code: "error" };
  const { error } = await client.rpc("mark_item_delivered", { p_id: id });
  return error ? mapFeeError(error) : { status: "done" };
}

export async function deleteItem(client: ServerSupabase, id: string): Promise<FeeResult> {
  if (!idSchema.safeParse(id).success) return { status: "error", code: "error" };
  const { error } = await client.rpc("delete_fee_item", { p_id: id });
  return error ? mapFeeError(error) : { status: "done" };
}
