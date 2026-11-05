import type { SupabaseClient } from "@supabase/supabase-js";

import { fromCents, parseMoneyToCents } from "@/lib/money";
import type { Database } from "@/types/database";
import {
  type CancelRecurringResult,
  cancelRecurringSchema,
  type WinDealResult,
  winDealSchema,
} from "@/types/deal-win";

const insufficientPrivilege = "42501";

interface RpcError {
  code?: string | null;
  message?: string | null;
}

export function mapWinError(error: RpcError): WinDealResult {
  if (error.code === insufficientPrivilege) return { status: "forbidden" };
  switch (error.message) {
    case "deal_not_found":
      return { status: "not_found" };
    case "deal_already_won":
      return { status: "already_won" };
    case "deal_lost":
      return { status: "lost" };
    case "invalid_amount":
      return { status: "invalid", field: "wonAmount" };
    case "invalid_recurring":
      return { status: "invalid", field: "recurringMonthly" };
    default:
      return { status: "error" };
  }
}

export function mapCancelError(error: RpcError): CancelRecurringResult {
  if (error.code === insufficientPrivilege) return { status: "forbidden" };
  switch (error.message) {
    case "no_recurring":
    case "deal_not_found":
      return { status: "not_recurring" };
    case "recurring_already_cancelled":
      return { status: "already_cancelled" };
    default:
      return { status: "error" };
  }
}

export async function winDeal(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<WinDealResult> {
  const parsed = winDealSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: "wonAmount" };
  const won = parseMoneyToCents(parsed.data.wonAmount);
  if (won === null || won <= 0) return { status: "invalid", field: "wonAmount" };
  const recurringText = parsed.data.recurringMonthly.trim();
  const recurring = recurringText === "" ? null : parseMoneyToCents(recurringText);
  if (recurringText !== "" && (recurring === null || recurring <= 0)) {
    return { status: "invalid", field: "recurringMonthly" };
  }
  try {
    const { error } = await client.rpc("win_deal", {
      p_deal_id: parsed.data.dealId,
      p_won_amount: fromCents(won),
      p_recurring_monthly: recurring === null ? undefined : fromCents(recurring),
    });
    return error ? mapWinError(error) : { status: "done" };
  } catch {
    return { status: "error" };
  }
}

export async function cancelRecurring(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<CancelRecurringResult> {
  const parsed = cancelRecurringSchema.safeParse(raw);
  if (!parsed.success) return { status: "error" };
  try {
    const { error } = await client.rpc("cancel_recurring", { p_deal_id: parsed.data.dealId });
    return error ? mapCancelError(error) : { status: "done" };
  } catch {
    return { status: "error" };
  }
}
