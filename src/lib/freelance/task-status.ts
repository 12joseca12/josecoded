import { z } from "zod";

import { mapTodoError } from "@/lib/area/todo-actions";
import type { ServerSupabase } from "@/lib/supabase/server";
import { type TaskStatus, taskStatuses, type TodoActionResult } from "@/types/area";

const idSchema = z.uuid();
const statusSchema = z.enum(taskStatuses);

export async function setMyTaskStatus(
  client: ServerSupabase,
  id: string,
  status: TaskStatus,
): Promise<TodoActionResult> {
  if (!idSchema.safeParse(id).success || !statusSchema.safeParse(status).success) {
    return { status: "error" };
  }
  const { error } = await client.rpc("set_my_task_status", { p_id: id, p_status: status });
  return error ? mapTodoError(error) : { status: "done" };
}
