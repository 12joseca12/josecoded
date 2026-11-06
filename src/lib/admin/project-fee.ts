import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { fromCents } from "@/lib/money";
import {
  addItemSchema,
  approveSchema,
  deleteItemSchema,
  type FeeActionResult,
  type FeeErrorCode,
  feeErrorCodes,
  type FeeField,
  feeFields,
  feeInputSchema,
  feeItemSchema,
  type FeeResult,
  feeSummarySchema,
  rejectSchema,
} from "@/types/admin-project-fee";
import type { Database } from "@/types/database";

export interface RpcFailure {
  code?: string | null;
  message?: string | null;
}

const knownCodes = new Set<string>(feeErrorCodes);

export function mapFeeError(error: RpcFailure): FeeErrorCode {
  const message = error.message ?? "";
  if (knownCodes.has(message)) return message as FeeErrorCode;
  if (error.code === "42501") return "forbidden";
  return "error";
}

function firstField(issues: readonly { path: PropertyKey[] }[]): FeeField {
  const key = issues[0]?.path[0];
  return feeFields.find((field) => field === key) ?? "mode";
}

const summariesSchema = z.array(feeSummarySchema);
const itemsSchema = z.array(feeItemSchema);

const itemColumns =
  "id, fee_id, label, hours, amount, worked_on, status, rejected_reason, submitted_by";

export async function fetchProjectFee(
  client: SupabaseClient<Database>,
  projectId: string,
  freelanceId: string | null,
): Promise<FeeResult> {
  try {
    const summaries = await client
      .from("freelance_fee_summary")
      .select("*")
      .eq("project_id", projectId);
    if (summaries.error) return { status: "error" };
    const parsed = summariesSchema.safeParse(summaries.data);
    if (!parsed.success) return { status: "error" };
    const fee = parsed.data.find((row) => row.freelance_id === freelanceId) ?? null;
    if (fee === null) return { status: "ok", fee: null, items: [] };
    const items = await client
      .from("freelance_fee_items")
      .select(itemColumns)
      .eq("fee_id", fee.fee_id)
      .order("created_at");
    if (items.error) return { status: "error" };
    const parsedItems = itemsSchema.safeParse(items.data);
    return parsedItems.success
      ? { status: "ok", fee, items: parsedItems.data }
      : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

async function call(
  run: () => PromiseLike<{ error: RpcFailure | null }>,
): Promise<FeeActionResult> {
  try {
    const { error } = await run();
    return error ? { status: "error", code: mapFeeError(error) } : { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runSetFee(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<FeeActionResult> {
  const parsed = feeInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: firstField(parsed.error.issues) };
  const input = parsed.data;
  try {
    const { data, error } = await client.rpc("set_freelance_fee", {
      p_project_id: input.projectId,
      p_mode: input.mode,
      p_amount:
        input.mode === "fixed" && input.amount !== null ? fromCents(input.amount) : undefined,
      p_hourly_rate:
        input.mode === "hourly" && input.hourlyRate !== null
          ? fromCents(input.hourlyRate)
          : undefined,
      p_hours_cap: input.mode === "hourly" && input.hoursCap !== null ? input.hoursCap : undefined,
      p_note: input.note ?? undefined,
    });
    if (error) return { status: "error", code: mapFeeError(error) };
    const feeId = z.uuid().safeParse(data);
    if (!feeId.success) return { status: "error", code: "error" };
    if (input.mode === "fixed" && input.amount !== null && input.firstItemLabel !== "") {
      const existing = await client
        .from("freelance_fee_items")
        .select("id")
        .eq("fee_id", feeId.data)
        .limit(1);
      if (!existing.error && existing.data.length === 0) {
        return await call(() =>
          client.rpc("add_fee_item", {
            p_fee_id: feeId.data,
            p_label: input.firstItemLabel,
            p_amount: fromCents(input.amount ?? 0),
          }),
        );
      }
    }
    return { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runAddItem(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<FeeActionResult> {
  const parsed = addItemSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: firstField(parsed.error.issues) };
  const input = parsed.data;
  return call(() =>
    client.rpc("add_fee_item", {
      p_fee_id: input.feeId,
      p_label: input.label,
      p_amount: fromCents(input.amount),
      p_worked_on: input.workedOn ?? undefined,
    }),
  );
}

export async function runApproveItems(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<FeeActionResult> {
  const parsed = approveSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: "ids" };
  try {
    const { data, error } = await client.rpc("approve_fee_items", { p_ids: parsed.data.ids });
    if (error) return { status: "error", code: mapFeeError(error) };
    return { status: "done", count: typeof data === "number" ? data : parsed.data.ids.length };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runRejectItem(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<FeeActionResult> {
  const parsed = rejectSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: "reason" };
  const input = parsed.data;
  return call(() => client.rpc("reject_fee_item", { p_id: input.id, p_reason: input.reason }));
}

export async function runDeleteItem(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<FeeActionResult> {
  const parsed = deleteItemSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: "ids" };
  const input = parsed.data;
  return call(() => client.rpc("delete_fee_item", { p_id: input.id }));
}
