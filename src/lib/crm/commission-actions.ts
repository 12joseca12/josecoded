import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type ApproveErrorCode,
  approveLinesSchema,
  type ApproveResult,
  type RejectErrorCode,
  rejectLineSchema,
  type RejectResult,
} from "@/types/commissions";
import type { Database } from "@/types/database";

interface RpcFailure {
  code?: string | null;
  message?: string | null;
}

const approveCodes: readonly ApproveErrorCode[] = [
  "invalid_selection",
  "line_not_accrued",
  "forbidden",
  "error",
];
const rejectCodes: readonly RejectErrorCode[] = [
  "reason_required",
  "line_not_accrued",
  "line_not_found",
  "forbidden",
  "error",
];

export function mapApproveError(error: RpcFailure): ApproveErrorCode {
  const found = approveCodes.find((code) => code === error.message);
  if (found !== undefined) return found;
  return error.code === "42501" ? "forbidden" : "error";
}

export function mapRejectError(error: RpcFailure): RejectErrorCode {
  const found = rejectCodes.find((code) => code === error.message);
  if (found !== undefined) return found;
  return error.code === "42501" ? "forbidden" : "error";
}

export async function approveLines(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<ApproveResult> {
  const parsed = approveLinesSchema.safeParse(raw);
  if (!parsed.success) return { status: "failed", code: "invalid_selection" };
  try {
    const { data, error } = await client.rpc("approve_commission_lines", {
      p_ids: parsed.data.ids,
    });
    if (error) return { status: "failed", code: mapApproveError(error) };
    return { status: "done", count: data };
  } catch {
    return { status: "failed", code: "error" };
  }
}

export async function rejectLine(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<RejectResult> {
  const parsed = rejectLineSchema.safeParse(raw);
  if (!parsed.success) return { status: "failed", code: "reason_required" };
  try {
    const { error } = await client.rpc("reject_commission_line", {
      p_id: parsed.data.id,
      p_reason: parsed.data.reason,
    });
    return error ? { status: "failed", code: mapRejectError(error) } : { status: "done" };
  } catch {
    return { status: "failed", code: "error" };
  }
}
