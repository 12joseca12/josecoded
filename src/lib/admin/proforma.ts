import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";
import { type ProformaResult, proformaRowSchema } from "@/types/proforma";

const columns =
  "id, number, kind, issued_at, amount_net, vat_rate, vat_amount, amount_gross, status, payment_schedule(label, due_at), deals(contacts(full_name, organization))";

export async function fetchProforma(
  client: SupabaseClient<Database>,
  id: string,
): Promise<ProformaResult> {
  if (!z.uuid().safeParse(id).success) return { status: "missing" };
  try {
    const { data, error } = await client
      .from("invoices")
      .select(columns)
      .eq("id", id)
      .eq("kind", "proforma")
      .maybeSingle();
    if (error) return { status: "error" };
    if (data === null) return { status: "missing" };
    const parsed = proformaRowSchema.safeParse(data);
    return parsed.success ? { status: "ok", proforma: parsed.data } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}
