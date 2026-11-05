"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { completeTask, decideReview } from "@/lib/area/todo-actions";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TodoActionResult } from "@/types/area";

async function open(locale: string) {
  if (!isLocale(locale)) return null;
  await requireZone("area", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return null;
  return client;
}

export async function completeTaskAction(locale: string, id: string): Promise<TodoActionResult> {
  const client = await open(locale);
  if (client === null) return { status: "error" };
  const result = await completeTask(client, id);
  if (result.status === "done" || result.status === "stale") {
    revalidatePath(`/${locale}/area`, "layout");
  }
  return result;
}

export async function confirmStoryAction(
  locale: string,
  id: string,
  accept = true,
): Promise<TodoActionResult> {
  const client = await open(locale);
  if (client === null) return { status: "error" };
  const result = await decideReview(client, id, accept);
  if (result.status === "done" || result.status === "stale") {
    revalidatePath(`/${locale}/area`, "layout");
  }
  return result;
}
