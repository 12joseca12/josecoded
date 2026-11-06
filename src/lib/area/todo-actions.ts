import { z } from "zod";

import type { ServerSupabase } from "@/lib/supabase/server";
import type { TodoActionResult } from "@/types/area";

const idSchema = z.uuid();
const insufficientPrivilege = "42501";

interface RpcError {
  code?: string | null;
  message?: string | null;
}

const staleMessages = [
  "story_not_in_review",
  "task_already_done",
  "task_not_found",
  "story_not_found",
];

export function mapTodoError(error: RpcError): TodoActionResult {
  if (error.code === insufficientPrivilege) return { status: "forbidden" };
  if (staleMessages.some((message) => error.message?.includes(message))) return { status: "stale" };
  return { status: "error" };
}

export async function completeTask(client: ServerSupabase, id: string): Promise<TodoActionResult> {
  if (!idSchema.safeParse(id).success) return { status: "error" };
  const { error } = await client.rpc("complete_my_task", { p_id: id });
  return error ? mapTodoError(error) : { status: "done" };
}

export async function decideReview(
  client: ServerSupabase,
  id: string,
  accept: boolean,
): Promise<TodoActionResult> {
  if (!idSchema.safeParse(id).success) return { status: "error" };
  const { error } = await client.rpc("confirm_story", { p_id: id, p_accept: accept });
  return error ? mapTodoError(error) : { status: "done" };
}
