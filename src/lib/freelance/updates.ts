import { z } from "zod";

import type { ServerSupabase } from "@/lib/supabase/server";
import {
  type TaskOption,
  taskOptionSchema,
  type UpdateErrorCode,
  updateErrorCodes,
  updateInputSchema,
  type UpdateResult,
  type UpdateRow,
  updateRowSchema,
  updateVisibilities,
  type UpdateVisibility,
} from "@/types/project-updates";

const updateColumns = "id, project_id, author_id, task_id, body, visibility, created_at";
const idSchema = z.uuid();
const known = new Set<string>(updateErrorCodes);

export type Loaded<T> = { status: "ok"; data: T } | { status: "error" };

export function mapUpdateError(error: {
  code?: string | null;
  message?: string | null;
}): UpdateResult {
  if (error.code === "42501") return { status: "error", code: "forbidden" };
  const message = error.message ?? "";
  const code: UpdateErrorCode = known.has(message) ? (message as UpdateErrorCode) : "error";
  return { status: "error", code };
}

export async function fetchUpdates(
  client: ServerSupabase,
  projectId: string,
  limit = 50,
): Promise<Loaded<UpdateRow[]>> {
  const { data, error } = await client
    .from("project_updates")
    .select(updateColumns)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { status: "error" };
  const parsed = z.array(updateRowSchema).safeParse(data);
  return parsed.success ? { status: "ok", data: parsed.data } : { status: "error" };
}

export async function fetchLatestUpdates(
  client: ServerSupabase,
  limit = 6,
): Promise<Loaded<UpdateRow[]>> {
  const { data, error } = await client
    .from("project_updates")
    .select(updateColumns)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { status: "error" };
  const parsed = z.array(updateRowSchema).safeParse(data);
  return parsed.success ? { status: "ok", data: parsed.data } : { status: "error" };
}

export async function fetchTaskOptions(
  client: ServerSupabase,
  projectId: string,
): Promise<Loaded<TaskOption[]>> {
  const { data, error } = await client
    .from("project_tasks")
    .select("id, title, assigned_to_me")
    .eq("project_id", projectId)
    .order("sort");
  if (error) return { status: "error" };
  const parsed = z.array(taskOptionSchema).safeParse(data);
  return parsed.success ? { status: "ok", data: parsed.data } : { status: "error" };
}

export async function createUpdate(client: ServerSupabase, raw: unknown): Promise<UpdateResult> {
  const parsed = updateInputSchema.safeParse(raw);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { status: "invalid", field: field === "taskId" ? "taskId" : "body" };
  }
  const { error } = await client.from("project_updates").insert({
    project_id: parsed.data.projectId,
    body: parsed.data.body,
    visibility: parsed.data.visibility,
    ...(parsed.data.taskId === null ? {} : { task_id: parsed.data.taskId }),
  });
  return error ? mapUpdateError(error) : { status: "done" };
}

export async function changeVisibility(
  client: ServerSupabase,
  id: string,
  visibility: UpdateVisibility,
): Promise<UpdateResult> {
  if (!idSchema.safeParse(id).success || !updateVisibilities.includes(visibility)) {
    return { status: "error", code: "error" };
  }
  const { error } = await client.rpc("set_update_visibility", {
    p_id: id,
    p_visibility: visibility,
  });
  return error ? mapUpdateError(error) : { status: "done" };
}

export async function removeUpdate(client: ServerSupabase, id: string): Promise<UpdateResult> {
  if (!idSchema.safeParse(id).success) return { status: "error", code: "error" };
  const { data, error } = await client.from("project_updates").delete().eq("id", id).select("id");
  if (error) return mapUpdateError(error);
  return data.length === 0 ? { status: "error", code: "update_not_found" } : { status: "done" };
}
