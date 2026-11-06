"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { requireZone } from "@/lib/auth/session";
import { commitImport, previewImport } from "@/lib/crm/import-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ImportCommitResult, ImportPreviewResult } from "@/types/crm-import";

export async function previewImportAction(
  locale: string,
  data: FormData,
): Promise<ImportPreviewResult> {
  if (!isLocale(locale)) return { status: "error" };
  const member = await requireZone("crm", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" };
  return previewImport(client, member, data);
}

export async function commitImportAction(
  locale: string,
  data: FormData,
): Promise<ImportCommitResult> {
  if (!isLocale(locale)) return { status: "error" };
  const member = await requireZone("crm", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" };
  const result = await commitImport(client, member, data);
  if (result.status === "done") {
    revalidatePath(`/${locale}/crm`, "layout");
  }
  return result;
}
