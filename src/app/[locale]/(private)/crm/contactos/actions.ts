"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { requireZone } from "@/lib/auth/session";
import { changeDealStage, createContact } from "@/lib/crm/contact-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ChangeStageResult, NewContactResult } from "@/types/crm";

export async function createContactAction(locale: string, raw: unknown): Promise<NewContactResult> {
  if (!isLocale(locale)) return { status: "error" };
  const member = await requireZone("crm", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" };
  const result = await createContact(client, member.userId, raw);
  if (result.status === "done") revalidatePath(`/${locale}/crm/contactos`, "layout");
  return result;
}

export async function changeStageAction(locale: string, raw: unknown): Promise<ChangeStageResult> {
  if (!isLocale(locale)) return { status: "error" };
  await requireZone("crm", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" };
  const result = await changeDealStage(client, raw);
  if (result.status === "done" || result.status === "stale") {
    revalidatePath(`/${locale}/crm/contactos`, "layout");
  }
  return result;
}
