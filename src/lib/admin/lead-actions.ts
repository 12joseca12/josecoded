import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { assignLeadSchema, discardLeadSchema, type LeadActionResult } from "@/types/leads";

export interface LeadActionError {
  code?: string | null;
  message?: string | null;
}

const staleMessages = new Set([
  "lead_already_claimed",
  "lead_discarded",
  "lead_not_discardable",
  "lead_not_found",
  "lead_not_touchable",
]);

const reasonMessages = new Set(["reason_required", "reason_too_long"]);

export function mapLeadActionError(error: LeadActionError): LeadActionResult {
  const message = error.message ?? "";
  if (staleMessages.has(message)) return { status: "stale" };
  if (message === "invalid_assignee") return { status: "invalid", field: "assignee" };
  if (reasonMessages.has(message)) return { status: "invalid", field: "reason" };
  if (error.code === "42501") return { status: "forbidden" };
  return { status: "error" };
}

export async function runLeadAction(
  client: SupabaseClient<Database>,
  kind: "assign" | "discard",
  raw: unknown,
): Promise<LeadActionResult> {
  try {
    if (kind === "assign") {
      const parsed = assignLeadSchema.safeParse(raw);
      if (!parsed.success) return { status: "invalid", field: "assignee" };
      const { error } = await client.rpc("assign_lead", {
        p_lead_id: parsed.data.leadId,
        p_user_id: parsed.data.userId,
      });
      return error ? mapLeadActionError(error) : { status: "done" };
    }
    const parsed = discardLeadSchema.safeParse(raw);
    if (!parsed.success) return { status: "invalid", field: "reason" };
    const { error } = await client.rpc("discard_lead", {
      p_lead_id: parsed.data.leadId,
      p_reason: parsed.data.reason,
    });
    return error ? mapLeadActionError(error) : { status: "done" };
  } catch {
    return { status: "error" };
  }
}
