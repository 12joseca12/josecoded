import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  archiveInputSchema,
  moveTaskSchema,
  phaseInputSchema,
  type ProjectDetailResult,
  type TaskErrorCode,
  taskErrorCodes,
  type TaskField,
  taskFields,
  taskIdSchema,
  taskInputSchema,
  type TaskResult,
  taskRowSchema,
} from "@/types/admin-project-detail";
import { type ProjectRow, projectRowSchema } from "@/types/admin-projects";
import type { Database } from "@/types/database";

export interface RpcFailure {
  code?: string | null;
  message?: string | null;
}

const knownCodes = new Set<string>(taskErrorCodes);

export function mapTaskError(error: RpcFailure): TaskErrorCode {
  const message = error.message ?? "";
  if (knownCodes.has(message)) return message as TaskErrorCode;
  if (error.code === "42501") return "forbidden";
  return "error";
}

function firstField(issues: readonly { path: PropertyKey[] }[]): TaskField {
  const key = issues[0]?.path[0];
  return taskFields.find((field) => field === key) ?? "title";
}

const tasksSchema = z.array(taskRowSchema);
const briefSchema = z.array(z.object({ brief: z.string().nullable() }));

export async function fetchProject(
  client: SupabaseClient<Database>,
  id: string,
): Promise<{ status: "ok"; project: ProjectRow } | { status: "missing" } | { status: "error" }> {
  try {
    const { data, error } = await client.from("project_overview").select("*").eq("id", id);
    if (error) return { status: "error" };
    const parsed = z.array(projectRowSchema).safeParse(data);
    if (!parsed.success) return { status: "error" };
    const [project] = parsed.data;
    return project === undefined ? { status: "missing" } : { status: "ok", project };
  } catch {
    return { status: "error" };
  }
}

export async function fetchProjectTasks(
  client: SupabaseClient<Database>,
  id: string,
): Promise<ProjectDetailResult> {
  try {
    const [brief, tasks] = await Promise.all([
      client.from("projects").select("brief").eq("id", id),
      client
        .from("project_tasks")
        .select(
          "id, project_id, phase, title, description, status, assignee_id, story_id, sort, done_at",
        )
        .eq("project_id", id)
        .order("sort")
        .order("created_at"),
    ]);
    if (brief.error || tasks.error) return { status: "error" };
    const parsedBrief = briefSchema.safeParse(brief.data);
    const parsedTasks = tasksSchema.safeParse(tasks.data);
    if (!parsedBrief.success || !parsedTasks.success) return { status: "error" };
    const [first] = parsedBrief.data;
    if (first === undefined) return { status: "missing" };
    return { status: "ok", brief: first.brief, tasks: parsedTasks.data };
  } catch {
    return { status: "error" };
  }
}

async function rpc(call: () => PromiseLike<{ error: RpcFailure | null }>): Promise<TaskResult> {
  try {
    const { error } = await call();
    return error ? { status: "error", code: mapTaskError(error) } : { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runUpsertTask(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<TaskResult> {
  const parsed = taskInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: firstField(parsed.error.issues) };
  const input = parsed.data;
  return rpc(() =>
    client.rpc("upsert_task", {
      p_project_id: input.projectId,
      p_title: input.title,
      p_phase: input.phase,
      p_id: input.id ?? undefined,
      p_description: input.description ?? undefined,
      p_status: input.status,
      p_assignee_id: input.assigneeId ?? undefined,
      p_story_id: input.storyId ?? undefined,
    }),
  );
}

export async function runMoveTask(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<TaskResult> {
  const parsed = moveTaskSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", code: "task_not_found" };
  const { id, phase, sort } = parsed.data;
  return rpc(() => client.rpc("move_task", { p_id: id, p_phase: phase, p_sort: sort }));
}

export async function runDeleteTask(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<TaskResult> {
  const parsed = taskIdSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", code: "task_not_found" };
  return rpc(() => client.rpc("delete_task", { p_id: parsed.data.id }));
}

export async function runSetPhase(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<TaskResult> {
  const parsed = phaseInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", code: "project_not_found" };
  return rpc(() =>
    client.rpc("set_project_phase", { p_id: parsed.data.id, p_phase: parsed.data.phase }),
  );
}

export async function runArchive(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<TaskResult> {
  const parsed = archiveInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", code: "project_not_found" };
  return rpc(() =>
    client.rpc("archive_project", { p_id: parsed.data.id, p_archived: parsed.data.archived }),
  );
}
