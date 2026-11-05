import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";

export interface MyRates {
  project: number | null;
  recurring: number | null;
}

export type RatesSource = { status: "ok"; data: MyRates } | { status: "error" };

const ratesRowSchema = z.object({
  closer_rate: z.number().nullable(),
  closer_recurring_rate: z.number().nullable(),
});

export async function fetchMyRates(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<RatesSource> {
  try {
    const { data, error } = await client
      .from("profiles")
      .select("closer_rate, closer_recurring_rate")
      .eq("id", userId)
      .maybeSingle();
    if (error) return { status: "error" };
    const row = ratesRowSchema.safeParse(data);
    return row.success
      ? {
          status: "ok",
          data: { project: row.data.closer_rate, recurring: row.data.closer_recurring_rate },
        }
      : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

export function formatRate(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}
