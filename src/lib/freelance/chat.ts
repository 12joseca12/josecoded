import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { listRoomMembers, listRoomMessages } from "@/lib/chat/room";
import type { Database } from "@/types/database";
import type { FreelanceChatResult } from "@/types/freelance-chat";
import { roomSummarySchema } from "@/types/room";

type Client = SupabaseClient<Database>;

const summariesSchema = z.array(roomSummarySchema);
const taskTitleSchema = z.array(z.object({ title: z.string() }));

export function parseUuidParam(value: string | string[] | undefined): string | null {
  const single = Array.isArray(value) ? value[0] : value;
  return single !== undefined && z.uuid().safeParse(single).success ? single : null;
}

export async function fetchFreelanceChat(client: Client): Promise<FreelanceChatResult> {
  try {
    const ensured = await client.rpc("ensure_my_conversation");
    if (ensured.error || typeof ensured.data !== "string") return { status: "error" };
    const ownRoomId = ensured.data;

    const list = await client
      .from("my_conversations")
      .select("*")
      .in("kind", ["freelance"])
      .order("last_activity_at", { ascending: false })
      .limit(10);
    if (list.error) return { status: "error" };
    const parsed = summariesSchema.safeParse(list.data);
    if (!parsed.success) return { status: "error" };
    const summary = parsed.data.find((room) => room.id === ownRoomId);
    if (!summary) return { status: "error" };

    const [messages, members] = await Promise.all([
      listRoomMessages(client, summary.id, null),
      listRoomMembers(client, summary.id),
    ]);
    if (messages.status === "failed" || members === null) return { status: "error" };
    return { status: "ok", summary, messages: messages.messages, members };
  } catch {
    return { status: "error" };
  }
}

export async function fetchTaskTitle(client: Client, taskId: string): Promise<string | null> {
  const { data, error } = await client
    .from("project_tasks")
    .select("title")
    .eq("id", taskId)
    .limit(1);
  if (error) return null;
  const parsed = taskTitleSchema.safeParse(data);
  return parsed.success ? (parsed.data[0]?.title ?? null) : null;
}
