"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { requireZone } from "@/lib/auth/session";
import { deleteItem, markDelivered, submitHours } from "@/lib/freelance/fees";
import { setMyTaskStatus } from "@/lib/freelance/task-status";
import { changeVisibility, createUpdate, removeUpdate } from "@/lib/freelance/updates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type TaskStatus, type TodoActionResult } from "@/types/area";
import type { FeeResult } from "@/types/freelance-fees";
import type { UpdateResult, UpdateVisibility } from "@/types/project-updates";

async function open(locale: string) {
  if (!isLocale(locale)) return null;
  await requireZone("freelance", locale);
  return createSupabaseServerClient();
}

export async function setTaskStatusAction(
  locale: string,
  id: string,
  status: TaskStatus,
): Promise<TodoActionResult> {
  const client = await open(locale);
  if (client === null) return { status: "error" };
  const result = await setMyTaskStatus(client, id, status);
  if (result.status === "done" || result.status === "stale") {
    revalidatePath(`/${locale}/freelance`, "layout");
  }
  return result;
}

export async function createUpdateAction(locale: string, raw: unknown): Promise<UpdateResult> {
  const client = await open(locale);
  if (client === null) return { status: "error", code: "error" };
  const result = await createUpdate(client, raw);
  if (result.status === "done") revalidatePath(`/${locale}/freelance`, "layout");
  return result;
}

export async function setUpdateVisibilityAction(
  locale: string,
  id: string,
  visibility: UpdateVisibility,
): Promise<UpdateResult> {
  const client = await open(locale);
  if (client === null) return { status: "error", code: "error" };
  const result = await changeVisibility(client, id, visibility);
  if (result.status === "done") revalidatePath(`/${locale}/freelance`, "layout");
  return result;
}

export async function deleteUpdateAction(locale: string, id: string): Promise<UpdateResult> {
  const client = await open(locale);
  if (client === null) return { status: "error", code: "error" };
  const result = await removeUpdate(client, id);
  if (result.status === "done") revalidatePath(`/${locale}/freelance`, "layout");
  return result;
}

export async function submitHoursAction(locale: string, raw: unknown): Promise<FeeResult> {
  const client = await open(locale);
  if (client === null) return { status: "error", code: "error" };
  const result = await submitHours(client, raw);
  if (result.status === "done") revalidatePath(`/${locale}/freelance`, "layout");
  return result;
}

export async function markDeliveredAction(locale: string, id: string): Promise<FeeResult> {
  const client = await open(locale);
  if (client === null) return { status: "error", code: "error" };
  const result = await markDelivered(client, id);
  if (result.status === "done") revalidatePath(`/${locale}/freelance`, "layout");
  return result;
}

export async function deleteItemAction(locale: string, id: string): Promise<FeeResult> {
  const client = await open(locale);
  if (client === null) return { status: "error", code: "error" };
  const result = await deleteItem(client, id);
  if (result.status === "done") revalidatePath(`/${locale}/freelance`, "layout");
  return result;
}
