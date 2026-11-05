import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";
import {
  assigneeRowSchema,
  type LeadAssignee,
  type LeadDetailResult,
  leadDetailSchema,
  leadRowSchema,
  type LeadsResult,
} from "@/types/leads";

export const leadsLimit = 200;

export const leadColumns =
  "id, via, source, full_name, email, organization, contact_id, status, created_at, assigned_to, discard_reason, offer";

export const leadDetailColumns = `${leadColumns}, phone, message, locale, page_path, consent_at, assigned_at, assigned_by, deal_id, company, offer_url, wanted_by, has_domain, has_store_accounts, extras, offer_answers`;

const rowsSchema = z.array(leadRowSchema);
const assigneesSchema = z.array(assigneeRowSchema);

function loadAssignees(client: SupabaseClient<Database>) {
  return client
    .from("profiles")
    .select("id, full_name, role, is_active")
    .in("role", ["admin", "closer"])
    .order("full_name");
}

function toAssignees(data: unknown): LeadAssignee[] | null {
  const parsed = assigneesSchema.safeParse(data);
  if (!parsed.success) return null;
  return parsed.data.map((person) => ({
    id: person.id,
    name: person.full_name,
    assignable: person.role === "closer" && person.is_active,
  }));
}

export async function fetchLeads(client: SupabaseClient<Database>): Promise<LeadsResult> {
  try {
    const [leads, people] = await Promise.all([
      client
        .from("leads")
        .select(leadColumns)
        .order("created_at", { ascending: false })
        .limit(leadsLimit),
      loadAssignees(client),
    ]);
    if (leads.error || people.error) return { status: "error" };
    const rows = rowsSchema.safeParse(leads.data);
    const assignees = toAssignees(people.data);
    if (!rows.success || !assignees) return { status: "error" };
    return { status: "ok", rows: rows.data, assignees, limit: leadsLimit };
  } catch {
    return { status: "error" };
  }
}

export async function fetchLeadDetail(
  client: SupabaseClient<Database>,
  id: string,
): Promise<LeadDetailResult> {
  try {
    const [lead, people] = await Promise.all([
      client.from("leads").select(leadDetailColumns).eq("id", id).maybeSingle(),
      loadAssignees(client),
    ]);
    if (lead.error || people.error) return { status: "error" };
    if (lead.data === null) return { status: "missing" };
    const parsed = leadDetailSchema.safeParse(lead.data);
    const assignees = toAssignees(people.data);
    if (!parsed.success || !assignees) return { status: "error" };
    let dealStage: string | null = null;
    if (parsed.data.deal_id) {
      const deal = await client
        .from("deals")
        .select("stage")
        .eq("id", parsed.data.deal_id)
        .maybeSingle();
      dealStage = deal.data?.stage ?? null;
    }
    return { status: "ok", lead: parsed.data, assignees, dealStage };
  } catch {
    return { status: "error" };
  }
}

export function formatLeadDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(date);
}
