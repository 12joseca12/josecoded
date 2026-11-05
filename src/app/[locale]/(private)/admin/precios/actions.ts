"use server";

import { revalidatePath, updateTag } from "next/cache";

import { isLocale } from "@/i18n/config";
import { runPriceAction } from "@/lib/admin/prices";
import { requireZone } from "@/lib/auth/session";
import { catalogTag } from "@/lib/catalog/tag";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PriceActionKind, PriceActionResult } from "@/types/prices";

async function run(locale: string, kind: PriceActionKind, raw: unknown) {
  if (!isLocale(locale)) return { status: "error" } satisfies PriceActionResult;
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" } satisfies PriceActionResult;
  const result = await runPriceAction(client, kind, raw);
  if (result.status === "done" || result.status === "stale") {
    revalidatePath(`/${locale}/admin/precios`);
  }
  if (result.status === "done") updateTag(catalogTag);
  return result;
}

export async function savePrice(locale: string, raw: unknown): Promise<PriceActionResult> {
  return run(locale, "save", raw);
}

export async function archivePrice(locale: string, raw: unknown): Promise<PriceActionResult> {
  return run(locale, "archive", raw);
}

export async function movePrice(locale: string, raw: unknown): Promise<PriceActionResult> {
  return run(locale, "move", raw);
}
