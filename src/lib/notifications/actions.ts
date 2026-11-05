"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PrefActionResult,
  TelegramCodeResult,
  TelegramUnlinkResult,
  TestActionResult,
} from "@/types/notifications";
import { staffZoneSchema } from "@/types/staff";

import { runPrefAction, runTelegramCode, runTelegramUnlink, runTestAction } from "./data";

const pages = { admin: "/admin/notificaciones", crm: "/crm/ajustes" } as const;

async function open(zone: string, locale: string) {
  const parsed = staffZoneSchema.safeParse(zone);
  if (!parsed.success || !isLocale(locale)) return null;
  await requireZone(parsed.data, locale);
  const client = await createSupabaseServerClient();
  if (client === null) return null;
  return { client, path: `/${locale}${pages[parsed.data]}` };
}

export async function savePref(
  zone: string,
  locale: string,
  raw: unknown,
): Promise<PrefActionResult> {
  const session = await open(zone, locale);
  if (session === null) return { status: "error" };
  return runPrefAction(session.client, raw);
}

export async function generateTelegramCode(
  zone: string,
  locale: string,
): Promise<TelegramCodeResult> {
  const session = await open(zone, locale);
  if (session === null) return { status: "error" };
  return runTelegramCode(session.client);
}

export async function unlinkTelegram(zone: string, locale: string): Promise<TelegramUnlinkResult> {
  const session = await open(zone, locale);
  if (session === null) return { status: "error" };
  const result = await runTelegramUnlink(session.client);
  if (result.status === "done") revalidatePath(session.path);
  return result;
}

export async function sendTestNotification(
  zone: string,
  locale: string,
  raw: unknown,
): Promise<TestActionResult> {
  const session = await open(zone, locale);
  if (session === null) return { status: "error" };
  return runTestAction(session.client, raw);
}
