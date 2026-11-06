import { z } from "zod";

import type { ServerSupabase } from "@/lib/supabase/server";
import {
  type BoardTask,
  type ProjectPhase,
  projectPhases,
  type TaskDetailRow,
  taskDetailSchema,
  taskViewSchema,
} from "@/types/area";

import type { Fetched } from "./overview";

const boardColumns = "id, title, phase, status, assigned_to_me, assignee_kind, story_id";
const detailColumns = `${boardColumns}, description, done_at`;
const uuidSchema = z.uuid();
const storyTitleSchema = z.array(z.object({ id: z.uuid(), title: z.string() }));
const detailViewSchema = taskViewSchema.extend({
  description: z.string().nullable(),
  done_at: z.string().nullable(),
});

async function storiesById(
  client: ServerSupabase,
  ids: readonly string[],
): Promise<Map<string, { id: string; title: string }> | null> {
  if (ids.length === 0) return new Map();
  const { data, error } = await client
    .from("stories")
    .select("id, title")
    .in("id", [...ids]);
  if (error) return null;
  const parsed = storyTitleSchema.safeParse(data);
  if (!parsed.success) return null;
  return new Map(parsed.data.map((story) => [story.id, story]));
}

export async function fetchBoard(
  client: ServerSupabase,
  projectId: string,
): Promise<Fetched<BoardTask[]>> {
  const { data, error } = await client
    .from("project_tasks")
    .select(boardColumns)
    .eq("project_id", projectId)
    .order("sort");
  if (error) return { status: "error" };
  const parsed = z.array(taskViewSchema).safeParse(data);
  if (!parsed.success) return { status: "error" };
  const stories = await storiesById(
    client,
    parsed.data.flatMap((task) => (task.story_id ? [task.story_id] : [])),
  );
  if (stories === null) return { status: "error" };
  return {
    status: "ok",
    data: parsed.data.map(({ story_id, ...task }) => ({
      ...task,
      story: story_id ? (stories.get(story_id) ?? null) : null,
    })),
  };
}

export type TaskResult =
  { status: "ok"; task: TaskDetailRow } | { status: "missing" } | { status: "error" };

export async function fetchTask(
  client: ServerSupabase,
  projectId: string,
  id: string,
): Promise<TaskResult> {
  if (!uuidSchema.safeParse(id).success) return { status: "missing" };
  const { data, error } = await client
    .from("project_tasks")
    .select(detailColumns)
    .eq("project_id", projectId)
    .eq("id", id)
    .limit(1);
  if (error) return { status: "error" };
  if (data.length === 0) return { status: "missing" };
  const parsed = detailViewSchema.safeParse(data[0]);
  if (!parsed.success) return { status: "error" };
  const stories = await storiesById(client, parsed.data.story_id ? [parsed.data.story_id] : []);
  if (stories === null) return { status: "error" };
  const { story_id, ...task } = parsed.data;
  const detail = taskDetailSchema.safeParse({
    ...task,
    story: story_id ? (stories.get(story_id) ?? null) : null,
  });
  if (!detail.success) return { status: "error" };
  return { status: "ok", task: detail.data };
}

export function groupByPhase(tasks: readonly BoardTask[]): Record<ProjectPhase, BoardTask[]> {
  const groups = Object.fromEntries(projectPhases.map((phase) => [phase, [] as BoardTask[]]));
  for (const task of tasks) groups[task.phase]?.push(task);
  return groups as Record<ProjectPhase, BoardTask[]>;
}
