"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { isLocale } from "@/i18n/config";
import { runJobAction, runSettingAction } from "@/lib/admin/system";
import { requireZone } from "@/lib/auth/session";
import { settingsCacheTag } from "@/lib/settings/features";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobActionResult, SettingActionResult } from "@/types/system";

export async function saveSetting(locale: string, raw: unknown): Promise<SettingActionResult> {
  if (!isLocale(locale)) return { status: "error" };
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" };
  const result = await runSettingAction(client, raw);
  if (result.status === "done") {
    revalidateTag(settingsCacheTag, "max");
    revalidatePath(`/${locale}/admin/sistema`);
  }
  return result;
}

async function runJob(locale: string, kind: "retry" | "cancel", raw: unknown) {
  if (!isLocale(locale)) return { status: "error" } satisfies JobActionResult;
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" } satisfies JobActionResult;
  const result = await runJobAction(client, kind, raw);
  if (result.status === "done" || result.status === "stale") {
    revalidatePath(`/${locale}/admin/sistema`);
  }
  return result;
}

export async function retryJob(locale: string, raw: unknown): Promise<JobActionResult> {
  return runJob(locale, "retry", raw);
}

export async function cancelJob(locale: string, raw: unknown): Promise<JobActionResult> {
  return runJob(locale, "cancel", raw);
}
