import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { claimLeadSchema, type ClaimResult } from "@/types/inbox";

export interface ClaimError {
  code?: string | null;
  message?: string | null;
}

export function mapClaimError(error: ClaimError): ClaimResult {
  const message = error.message ?? "";
  if (message === "lead_already_claimed") return { status: "stale" };
  if (message === "claim_quota_exceeded") return { status: "quota" };
  if (error.code === "42501") return { status: "forbidden" };
  return { status: "error" };
}

export async function runClaimLead(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<ClaimResult> {
  const parsed = claimLeadSchema.safeParse(raw);
  if (!parsed.success) return { status: "error" };
  try {
    const { data, error } = await client.rpc("claim_lead", { p_lead_id: parsed.data.leadId });
    if (error) return mapClaimError(error);
    if (typeof data !== "string" || data === "") return { status: "handoff" };
    return { status: "done", contactId: data };
  } catch {
    return { status: "error" };
  }
}
