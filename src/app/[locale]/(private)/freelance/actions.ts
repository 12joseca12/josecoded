"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { requireZone } from "@/lib/auth/session";
import { setMyTaskStatus } from "@/lib/freelance/task-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type TaskStatus, type TodoActionResult } from "@/types/area";

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
