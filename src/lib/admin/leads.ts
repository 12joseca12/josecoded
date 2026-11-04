import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";
import { leadRowSchema, type LeadsResult } from "@/types/leads";

export const leadsLimit = 200;

const rowsSchema = z.array(leadRowSchema);

export async function fetchLeads(client: SupabaseClient<Database>): Promise<LeadsResult> {
  try {
    const { data, error } = await client
      .from("leads")
      .select("id, via, full_name, email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(leadsLimit);
    if (error) return { status: "error" };
    const rows = rowsSchema.safeParse(data);
    if (!rows.success) return { status: "error" };
    return { status: "ok", rows: rows.data, limit: leadsLimit };
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
