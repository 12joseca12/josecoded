import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";
import {
  activeInputSchema,
  type HistoryChange,
  type HistoryEntry,
  historyFields,
  type HistoryResult,
  type ManageErrorCode,
  manageErrorCodes,
  type ManageResult,
  rateFields,
  ratesInputSchema,
  reassignInputSchema,
  type ReassignResult,
  userIdInputSchema,
} from "@/types/users-manage";

export interface RpcFailure {
  code?: string | null;
  message?: string | null;
}

const knownCodes = new Set<string>(manageErrorCodes);

export function mapManageError(error: RpcFailure): ManageErrorCode {
  const message = error.message ?? "";
  if (knownCodes.has(message)) return message as ManageErrorCode;
  if (error.code === "42501") return "forbidden";
  return "error";
}

function firstRateField(issues: readonly { path: PropertyKey[] }[]) {
  const key = issues[0]?.path[0];
  return rateFields.find((field) => field === key) ?? "userId";
}

export async function runSetRates(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<ManageResult> {
  const parsed = ratesInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: firstRateField(parsed.error.issues) };
  const input = parsed.data;
  try {
    const { error } = await client.rpc("set_user_rates", {
      p_user_id: input.userId,
      p_closer_rate: input.closerRate ?? undefined,
      p_parent_rate: input.parentRate ?? undefined,
      p_closer_recurring_rate: input.closerRecurringRate ?? undefined,
      p_parent_recurring_rate: input.parentRecurringRate ?? undefined,
      p_payout_cadence: input.payoutCadence ?? undefined,
    });
    return error ? { status: "error", code: mapManageError(error) } : { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runSetActive(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<ManageResult> {
  const parsed = activeInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: "userId" };
  try {
    const { error } = await client.rpc("set_user_active", {
      p_user_id: parsed.data.userId,
      p_active: parsed.data.active,
    });
    return error ? { status: "error", code: mapManageError(error) } : { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}

const movedSchema = z
  .array(z.object({ contacts: z.number(), deals: z.number(), leads: z.number() }))
  .length(1);

export async function runReassign(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<ReassignResult> {
  const parsed = reassignInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", code: "invalid_assignee" };
  try {
    const { data, error } = await client.rpc("reassign_portfolio", {
      p_from_user: parsed.data.fromUserId,
      p_to_user: parsed.data.toUserId,
    });
    if (error) return { status: "error", code: mapManageError(error) };
    const moved = movedSchema.safeParse(data);
    const [row] = moved.success ? moved.data : [];
    if (row === undefined) return { status: "error", code: "error" };
    return { status: "done", ...row };
  } catch {
    return { status: "error", code: "error" };
  }
}

export interface TotpDeps {
  client: SupabaseClient<Database>;
  actorId: string;
  listFactorIds: (userId: string) => Promise<string[] | null>;
  deleteFactor: (userId: string, factorId: string) => Promise<boolean>;
}

export async function runResetTotp(deps: TotpDeps, raw: unknown): Promise<ManageResult> {
  const parsed = userIdInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: "userId" };
  const { userId } = parsed.data;
  if (userId === deps.actorId) return { status: "error", code: "cannot_reset_self" };
  try {
    const factors = await deps.listFactorIds(userId);
    if (factors === null) return { status: "error", code: "unavailable" };
    for (const factorId of factors) {
      if (!(await deps.deleteFactor(userId, factorId))) {
        return { status: "error", code: "unavailable" };
      }
    }
    const { error } = await deps.client.rpc("log_totp_reset", { p_user_id: userId });
    if (error) {
      const code = mapManageError(error);
      return { status: "error", code: code === "error" ? "unlogged" : code };
    }
    return { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}

const historyRow = z.object({
  id: z.number(),
  at: z.string(),
  actor_name: z.string().nullable(),
  action: z.string(),
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
});

export const historyLimit = 30;

function show(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

export function summarizeAudit(row: z.infer<typeof historyRow>): HistoryEntry | null {
  const base = { id: row.id, at: row.at, actor: row.actor_name };
  if (row.after?.totp_reset === true) return { ...base, kind: "totp_reset", changes: [] };
  if (row.action === "insert") return { ...base, kind: "insert", changes: [] };
  if (row.action !== "update" || row.before === null || row.after === null) return null;
  const changes: HistoryChange[] = [];
  for (const field of historyFields) {
    const before = show(row.before[field]);
    const after = show(row.after[field]);
    if (before !== after) changes.push({ field, before, after });
  }
  return changes.length === 0 ? null : { ...base, kind: "update", changes };
}

export async function runHistory(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<HistoryResult> {
  const parsed = userIdInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "error" };
  try {
    const { data, error } = await client.rpc("admin_audit_log", {
      p_table: "profiles",
      p_row_id: parsed.data.userId,
      p_limit: historyLimit,
    });
    if (error) return { status: "error" };
    const rows = z.array(historyRow).safeParse(data);
    if (!rows.success) return { status: "error" };
    const entries = rows.data.flatMap((row) => summarizeAudit(row) ?? []);
    return { status: "ok", entries };
  } catch {
    return { status: "error" };
  }
}
