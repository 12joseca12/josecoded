import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";
import {
  assigneeRowSchema,
  type LeadAssignee,
  leadRowSchema,
  type LeadsResult,
} from "@/types/leads";

export const leadsLimit = 200;

export const leadColumns =
  "id, via, full_name, email, status, created_at, assigned_to, discard_reason, offer";

const rowsSchema = z.array(leadRowSchema);
const assigneesSchema = z.array(assigneeRowSchema);

export async function fetchLeads(client: SupabaseClient<Database>): Promise<LeadsResult> {
  try {
    const [leads, people] = await Promise.all([
      client
        .from("leads")
        .select(leadColumns)
        .order("created_at", { ascending: false })
        .limit(leadsLimit),
      client
        .from("profiles")
        .select("id, full_name, role, is_active")
        .in("role", ["admin", "closer"])
        .order("full_name"),
    ]);
    if (leads.error || people.error) return { status: "error" };
    const rows = rowsSchema.safeParse(leads.data);
    const assignees = assigneesSchema.safeParse(people.data);
    if (!rows.success || !assignees.success) return { status: "error" };
    const list: LeadAssignee[] = assignees.data.map((person) => ({
      id: person.id,
      name: person.full_name,
      assignable: person.role === "closer" && person.is_active,
    }));
    return { status: "ok", rows: rows.data, assignees: list, limit: leadsLimit };
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
