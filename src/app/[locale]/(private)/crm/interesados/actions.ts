"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { requireZone } from "@/lib/auth/session";
import { runClaimLead } from "@/lib/crm/inbox-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClaimResult } from "@/types/inbox";

export async function claimLeadAction(locale: string, raw: unknown): Promise<ClaimResult> {
  if (!isLocale(locale)) return { status: "error" };
  await requireZone("crm", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" };
  const result = await runClaimLead(client, raw);
  if (result.status === "done" || result.status === "stale" || result.status === "handoff") {
    revalidatePath(`/${locale}/crm`, "layout");
  }
  return result;
}
