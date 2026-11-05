import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";
import {
  notificationEvents,
  type NotificationFailure,
  type NotificationSource,
  type PrefActionResult,
  prefActionSchema,
  type PrefMatrix,
  prefRowSchema,
  type TelegramCodeResult,
  type TelegramStatus,
  telegramStatusSchema,
  type TelegramUnlinkResult,
  type TestActionResult,
  testActionSchema,
} from "@/types/notifications";

export interface NotificationError {
  code?: string | null;
  message?: string | null;
}

const missingCodes = new Set(["PGRST202", "PGRST205", "42883", "42P01"]);
const codeShape = /^[A-Z2-9]{6}$/;

export function isMissingObject(error: NotificationError): boolean {
  return missingCodes.has(error.code ?? "");
}

function failure<T>(error: NotificationError): NotificationSource<T> {
  return isMissingObject(error) ? { status: "unavailable" } : { status: "error" };
}

export function mapNotificationError(error: NotificationError): NotificationFailure {
  if (error.code === "42501") return "forbidden";
  if (isMissingObject(error)) return "unavailable";
  return "error";
}

export function mergePrefs(rows: z.infer<typeof prefRowSchema>[]): PrefMatrix {
  const matrix = Object.fromEntries(
    notificationEvents.map((event) => [event, { telegram: true, email: true, bell: true }]),
  ) as PrefMatrix;
  for (const row of rows) {
    matrix[row.event] = { telegram: row.telegram, email: row.email, bell: row.bell };
  }
  return matrix;
}

const prefRowsSchema = z.array(prefRowSchema);

export async function fetchPrefs(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<NotificationSource<PrefMatrix>> {
  try {
    const { data, error } = await client
      .from("notification_prefs")
      .select("event, telegram, email, bell")
      .eq("user_id", userId);
    if (error) return failure(error);
    const rows = prefRowsSchema.safeParse(data);
    return rows.success ? { status: "ok", data: mergePrefs(rows.data) } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

const statusRowsSchema = z.array(telegramStatusSchema).length(1);

function toStatus(row: z.infer<typeof telegramStatusSchema>): TelegramStatus {
  return { linkedAt: row.linked_at, code: row.pending_code, expiresAt: row.pending_expires_at };
}

export async function fetchTelegramStatus(
  client: SupabaseClient<Database>,
): Promise<NotificationSource<TelegramStatus>> {
  try {
    const { data, error } = await client.rpc("telegram_link_status");
    if (error) return failure(error);
    const rows = statusRowsSchema.safeParse(data);
    const [row] = rows.success ? rows.data : [];
    return row ? { status: "ok", data: toStatus(row) } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

export async function runPrefAction(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<PrefActionResult> {
  const request = prefActionSchema.safeParse(raw);
  if (!request.success) return { status: "error" };
  try {
    const { error } = await client.rpc("set_notification_pref", {
      p_event: request.data.event,
      p_channel: request.data.channel,
      p_enabled: request.data.enabled,
    });
    return error ? { status: mapNotificationError(error) } : { status: "done" };
  } catch {
    return { status: "error" };
  }
}

export async function runTelegramCode(
  client: SupabaseClient<Database>,
): Promise<TelegramCodeResult> {
  try {
    const { data, error } = await client.rpc("telegram_link_code");
    if (error) return { status: mapNotificationError(error) };
    if (typeof data !== "string" || !codeShape.test(data)) return { status: "error" };
    const status = await fetchTelegramStatus(client);
    const expiresAt = status.status === "ok" ? status.data.expiresAt : null;
    return { status: "done", code: data, expiresAt };
  } catch {
    return { status: "error" };
  }
}

export async function runTelegramUnlink(
  client: SupabaseClient<Database>,
): Promise<TelegramUnlinkResult> {
  try {
    const { error } = await client.rpc("telegram_unlink");
    return error ? { status: mapNotificationError(error) } : { status: "done" };
  } catch {
    return { status: "error" };
  }
}

export async function runTestAction(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<TestActionResult> {
  const request = testActionSchema.safeParse(raw);
  if (!request.success) return { status: "error" };
  try {
    const { error } = await client.rpc("send_test_notification", {
      p_channel: request.data.channel,
    });
    if (!error) return { status: "done" };
    if (error.message === "telegram_not_linked") return { status: "not_linked" };
    return { status: mapNotificationError(error) };
  } catch {
    return { status: "error" };
  }
}
