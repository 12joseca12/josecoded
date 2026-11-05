import { z } from "zod";

import type { ServerSupabase } from "@/lib/supabase/server";
import {
  type BoardTask,
  boardTaskSchema,
  type ProjectPhase,
  projectPhases,
  type TaskDetailRow,
  taskDetailSchema,
} from "@/types/area";

import type { Fetched } from "./overview";

const storyEmbed = "story:stories!tasks_story_id_fkey(id, title)";
const boardColumns = `id, title, phase, status, assignee_id, ${storyEmbed}`;
const detailColumns = `${boardColumns}, description, done_at`;
const uuidSchema = z.uuid();

export async function fetchBoard(
  client: ServerSupabase,
  projectId: string,
): Promise<Fetched<BoardTask[]>> {
  const { data, error } = await client
    .from("tasks")
    .select(boardColumns)
    .eq("project_id", projectId)
    .order("sort");
  if (error) return { status: "error" };
  const parsed = z.array(boardTaskSchema).safeParse(data);
  if (!parsed.success) return { status: "error" };
  return { status: "ok", data: parsed.data };
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
    .from("tasks")
    .select(detailColumns)
    .eq("project_id", projectId)
    .eq("id", id)
    .limit(1);
  if (error) return { status: "error" };
  if (data.length === 0) return { status: "missing" };
  const parsed = taskDetailSchema.safeParse(data[0]);
  if (!parsed.success) return { status: "error" };
  return { status: "ok", task: parsed.data };
}

export function groupByPhase(tasks: readonly BoardTask[]): Record<ProjectPhase, BoardTask[]> {
  const groups = Object.fromEntries(projectPhases.map((phase) => [phase, [] as BoardTask[]]));
  for (const task of tasks) groups[task.phase]?.push(task);
  return groups as Record<ProjectPhase, BoardTask[]>;
}
