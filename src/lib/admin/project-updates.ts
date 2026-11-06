import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  createUpdateSchema,
  deleteUpdateSchema,
  setVisibilitySchema,
  type UpdateActionResult,
  type UpdateErrorCode,
  updateErrorCodes,
  type UpdateField,
  updateFields,
  updateRowSchema,
  type UpdatesResult,
} from "@/types/admin-project-updates";
import type { Database } from "@/types/database";

export interface RpcFailure {
  code?: string | null;
  message?: string | null;
}

const knownCodes = new Set<string>(updateErrorCodes);

export function mapUpdateError(error: RpcFailure): UpdateErrorCode {
  const message = error.message ?? "";
  if (knownCodes.has(message)) return message as UpdateErrorCode;
  if (error.code === "42501") return "forbidden";
  return "error";
}

function firstField(issues: readonly { path: PropertyKey[] }[]): UpdateField {
  const key = issues[0]?.path[0];
  return updateFields.find((field) => field === key) ?? "body";
}

const updatesSchema = z.array(updateRowSchema);
const idsSchema = z.array(z.object({ id: z.uuid() }));

const columns = "id, project_id, author_id, task_id, body, visibility, created_at";

export async function fetchUnreadUpdateIds(
  client: SupabaseClient<Database>,
  projectId: string,
): Promise<string[]> {
  try {
    const { data, error } = await client
      .from("notifications")
      .select("id")
      .eq("event", "project_update")
      .is("read_at", null)
      .like("href", `%/admin/proyectos/${projectId}?tab=avances`);
    if (error) return [];
    const parsed = idsSchema.safeParse(data);
    return parsed.success ? parsed.data.map((row) => row.id) : [];
  } catch {
    return [];
  }
}

export async function fetchProjectUpdates(
  client: SupabaseClient<Database>,
  projectId: string,
  markRead: boolean,
): Promise<UpdatesResult> {
  try {
    const [updates, unreadIds] = await Promise.all([
      client
        .from("project_updates")
        .select(columns)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      fetchUnreadUpdateIds(client, projectId),
    ]);
    if (updates.error) return { status: "error" };
    const parsed = updatesSchema.safeParse(updates.data);
    if (!parsed.success) return { status: "error" };
    if (markRead && unreadIds.length > 0) {
      await client.rpc("mark_notifications_read", { p_ids: unreadIds });
    }
    return { status: "ok", updates: parsed.data, unreadIds };
  } catch {
    return { status: "error" };
  }
}

async function call(
  run: () => PromiseLike<{ error: RpcFailure | null }>,
): Promise<UpdateActionResult> {
  try {
    const { error } = await run();
    return error ? { status: "error", code: mapUpdateError(error) } : { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runCreateUpdate(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<UpdateActionResult> {
  const parsed = createUpdateSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: firstField(parsed.error.issues) };
  const input = parsed.data;
  return call(() =>
    client.from("project_updates").insert({
      project_id: input.projectId,
      body: input.body,
      task_id: input.taskId,
      visibility: input.visibility,
    }),
  );
}

export async function runSetVisibility(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<UpdateActionResult> {
  const parsed = setVisibilitySchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: "body" };
  const input = parsed.data;
  return call(() =>
    client.rpc("set_update_visibility", { p_id: input.id, p_visibility: input.visibility }),
  );
}

export async function runDeleteUpdate(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<UpdateActionResult> {
  const parsed = deleteUpdateSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: "body" };
  try {
    const { data, error } = await client
      .from("project_updates")
      .delete()
      .eq("id", parsed.data.id)
      .select("id");
    if (error) return { status: "error", code: mapUpdateError(error) };
    return data.length === 0 ? { status: "error", code: "update_not_found" } : { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}
