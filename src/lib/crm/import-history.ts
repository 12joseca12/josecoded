import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { ImportHistoryRow, ImportOwner } from "@/types/crm-import";
import type { Database } from "@/types/database";

const historyLimit = 20;

const historySchema = z.array(
  z.object({
    id: z.uuid(),
    file_name: z.string(),
    created_at: z.string(),
    rows_created: z.number(),
    rows_updated: z.number(),
    rows_skipped: z.number(),
    rows_invalid: z.number(),
  }),
);

const ownersSchema = z.array(z.object({ id: z.uuid(), full_name: z.string() }));

export async function fetchImportHistory(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<ImportHistoryRow[] | null> {
  try {
    const { data, error } = await client
      .from("imports")
      .select("id, file_name, created_at, rows_created, rows_updated, rows_skipped, rows_invalid")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(historyLimit);
    if (error) return null;
    const parsed = historySchema.safeParse(data);
    if (!parsed.success) return null;
    return parsed.data.map((row) => ({
      id: row.id,
      fileName: row.file_name,
      createdAt: row.created_at,
      created: row.rows_created,
      updated: row.rows_updated,
      skipped: row.rows_skipped,
      invalid: row.rows_invalid,
    }));
  } catch {
    return null;
  }
}

export async function fetchImportOwners(
  client: SupabaseClient<Database>,
): Promise<ImportOwner[] | null> {
  try {
    const { data, error } = await client
      .from("profiles")
      .select("id, full_name")
      .in("role", ["admin", "closer"])
      .eq("is_active", true)
      .order("full_name");
    if (error) return null;
    const parsed = ownersSchema.safeParse(data);
    return parsed.success ? parsed.data.map((row) => ({ id: row.id, name: row.full_name })) : null;
  } catch {
    return null;
  }
}
