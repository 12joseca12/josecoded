"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { runCreateLead, runLeadAction } from "@/lib/admin/lead-actions";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LeadActionResult, NewLeadResult } from "@/types/leads";

async function run(locale: string, kind: "assign" | "discard", raw: unknown) {
  if (!isLocale(locale)) return { status: "error" } satisfies LeadActionResult;
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" } satisfies LeadActionResult;
  const result = await runLeadAction(client, kind, raw);
  if (result.status === "done" || result.status === "stale") {
    revalidatePath(`/${locale}/admin/interesados`, "layout");
  }
  return result;
}

export async function assignLead(locale: string, raw: unknown): Promise<LeadActionResult> {
  return run(locale, "assign", raw);
}

export async function discardLead(locale: string, raw: unknown): Promise<LeadActionResult> {
  return run(locale, "discard", raw);
}

export async function createLead(locale: string, raw: unknown): Promise<NewLeadResult> {
  if (!isLocale(locale)) return { status: "error" };
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" };
  const result = await runCreateLead(client, raw);
  if (result.status === "done") revalidatePath(`/${locale}/admin/interesados`, "layout");
  return result;
}
