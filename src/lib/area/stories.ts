import { z } from "zod";

import type { ServerSupabase } from "@/lib/supabase/server";
import {
  type StoryActionResult,
  type StoryDeleteResult,
  type StoryDetailRow,
  storyDetailSchema,
  type StoryField,
  storyFields,
  storyInputSchema,
  type StoryListRow,
  storyListSchema,
} from "@/types/area";

import type { Fetched } from "./overview";

const listColumns = "id, title, status, estimate_hours, estimate_amount, created_at";
const detailColumns = `${listColumns}, as_a, i_want, so_that, criteria, decision_note, decided_at, task_id, author_id`;
const uuidSchema = z.uuid();
const insufficientPrivilege = "42501";

export async function fetchStories(
  client: ServerSupabase,
  projectId: string,
): Promise<Fetched<StoryListRow[]>> {
  const { data, error } = await client
    .from("stories")
    .select(listColumns)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) return { status: "error" };
  const parsed = z.array(storyListSchema).safeParse(data);
  if (!parsed.success) return { status: "error" };
  return { status: "ok", data: parsed.data };
}

export type StoryResult =
  { status: "ok"; story: StoryDetailRow } | { status: "missing" } | { status: "error" };

export async function fetchStory(
  client: ServerSupabase,
  projectId: string,
  id: string,
): Promise<StoryResult> {
  if (!uuidSchema.safeParse(id).success) return { status: "missing" };
  const { data, error } = await client
    .from("stories")
    .select(detailColumns)
    .eq("project_id", projectId)
    .eq("id", id)
    .limit(1);
  if (error) return { status: "error" };
  if (data.length === 0) return { status: "missing" };
  const parsed = storyDetailSchema.safeParse(data[0]);
  if (!parsed.success) return { status: "error" };
  return { status: "ok", story: parsed.data };
}

function invalidField(path: readonly PropertyKey[]): StoryField {
  const [head] = path;
  return storyFields.find((field) => field === head) ?? "title";
}

function rowOf(input: z.infer<typeof storyInputSchema>) {
  return {
    title: input.title,
    as_a: input.asA,
    i_want: input.iWant,
    so_that: input.soThat,
    criteria: input.criteria,
  };
}

export async function createStory(
  client: ServerSupabase,
  userId: string,
  projectId: string,
  raw: unknown,
): Promise<StoryActionResult> {
  if (!uuidSchema.safeParse(projectId).success) return { status: "error" };
  const parsed = storyInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "invalid", field: invalidField(parsed.error.issues[0]?.path ?? []) };
  }
  const { data, error } = await client
    .from("stories")
    .insert({ project_id: projectId, author_id: userId, ...rowOf(parsed.data) })
    .select("id")
    .single();
  if (error) {
    return error.code === insufficientPrivilege ? { status: "forbidden" } : { status: "error" };
  }
  return { status: "done", id: data.id };
}

export async function updateStory(
  client: ServerSupabase,
  id: string,
  raw: unknown,
): Promise<StoryActionResult> {
  if (!uuidSchema.safeParse(id).success) return { status: "error" };
  const parsed = storyInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "invalid", field: invalidField(parsed.error.issues[0]?.path ?? []) };
  }
  const { data, error } = await client
    .from("stories")
    .update(rowOf(parsed.data))
    .eq("id", id)
    .eq("status", "proposed")
    .select("id");
  if (error) {
    return error.code === insufficientPrivilege ? { status: "forbidden" } : { status: "error" };
  }
  if (data.length === 0) return { status: "stale" };
  return { status: "done", id };
}

export async function deleteStory(client: ServerSupabase, id: string): Promise<StoryDeleteResult> {
  if (!uuidSchema.safeParse(id).success) return { status: "error" };
  const { data, error } = await client
    .from("stories")
    .delete()
    .eq("id", id)
    .eq("status", "proposed")
    .select("id");
  if (error) {
    return error.code === insufficientPrivilege ? { status: "forbidden" } : { status: "error" };
  }
  return { status: data.length === 0 ? "stale" : "done" };
}
