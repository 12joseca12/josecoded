"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { requireZone } from "@/lib/auth/session";
import { addActivity, reassignContact } from "@/lib/crm/detail-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AddActivityResult, ReassignResult } from "@/types/crm-detail";

export async function addActivityAction(locale: string, raw: unknown): Promise<AddActivityResult> {
  if (!isLocale(locale)) return { status: "error" };
  const member = await requireZone("crm", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" };
  const result = await addActivity(client, member.userId, raw);
  if (result.status === "done") revalidatePath(`/${locale}/crm/contactos`, "layout");
  return result;
}

export async function reassignContactAction(locale: string, raw: unknown): Promise<ReassignResult> {
  if (!isLocale(locale)) return { status: "error" };
  const member = await requireZone("crm", locale);
  if (member.role !== "admin") return { status: "forbidden" };
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" };
  const result = await reassignContact(client, raw);
  if (result.status === "done") revalidatePath(`/${locale}/crm/contactos`, "layout");
  return result;
}
