import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import {
  assignLeadSchema,
  discardLeadSchema,
  type LeadActionResult,
  type NewLeadField,
  type NewLeadResult,
  newLeadSchema,
} from "@/types/leads";

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

const newLeadFields: Record<string, NewLeadField> = {
  fullName: "fullName",
  email: "email",
  phone: "phone",
  organization: "organization",
  message: "message",
  assignedTo: "assignedTo",
};

export function mapNewLeadError(error: LeadActionError): NewLeadResult {
  const message = error.message ?? "";
  if (message === "invalid_assignee") return { status: "invalid", fields: ["assignedTo"] };
  if (error.code === "23514" && message.includes("leads_reachable")) {
    return { status: "invalid", fields: ["email"] };
  }
  if (error.code === "42501") return { status: "forbidden" };
  return { status: "error" };
}

export async function runCreateLead(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<NewLeadResult> {
  const parsed = newLeadSchema.safeParse(raw);
  if (!parsed.success) {
    const fields = new Set<NewLeadField>();
    for (const issue of parsed.error.issues) {
      const field = newLeadFields[String(issue.path[0])];
      if (field) fields.add(field);
    }
    return { status: "invalid", fields: [...fields] };
  }
  try {
    const { data, error } = await client
      .from("leads")
      .insert({
        source: parsed.data.source,
        via: parsed.data.via,
        full_name: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        organization: parsed.data.organization,
        message: parsed.data.message,
        assigned_to: parsed.data.assignedTo,
      })
      .select("id")
      .single();
    if (error) return mapNewLeadError(error);
    return { status: "done", id: data.id };
  } catch {
    return { status: "error" };
  }
}
