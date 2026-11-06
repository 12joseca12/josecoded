"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { createStory, deleteStory, updateStory } from "@/lib/area/stories";
import { completeTask, decideReview } from "@/lib/area/todo-actions";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { StoryActionResult, StoryDeleteResult, TodoActionResult } from "@/types/area";

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

export async function createStoryAction(
  locale: string,
  projectId: string,
  raw: unknown,
): Promise<StoryActionResult> {
  if (!isLocale(locale)) return { status: "error" };
  const member = await requireZone("area", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" };
  const result = await createStory(client, member.userId, projectId, raw);
  if (result.status === "done") revalidatePath(`/${locale}/area`, "layout");
  return result;
}

export async function updateStoryAction(
  locale: string,
  id: string,
  raw: unknown,
): Promise<StoryActionResult> {
  const client = await open(locale);
  if (client === null) return { status: "error" };
  const result = await updateStory(client, id, raw);
  if (result.status === "done" || result.status === "stale") {
    revalidatePath(`/${locale}/area`, "layout");
  }
  return result;
}

export async function deleteStoryAction(locale: string, id: string): Promise<StoryDeleteResult> {
  const client = await open(locale);
  if (client === null) return { status: "error" };
  const result = await deleteStory(client, id);
  if (result.status === "done" || result.status === "stale") {
    revalidatePath(`/${locale}/area`, "layout");
  }
  return result;
}
