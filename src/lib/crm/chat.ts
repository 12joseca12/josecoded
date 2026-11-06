import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { listRoomMembers, listRoomMessages } from "@/lib/chat/room";
import type { CrmChatResult } from "@/types/crm-chat";
import type { Database } from "@/types/database";
import { type RoomSummary, roomSummarySchema } from "@/types/room";

type Client = SupabaseClient<Database>;

const summariesSchema = z.array(roomSummarySchema);

export function pickRoom(rooms: RoomSummary[], ownRoomId: string, wanted: string | null) {
  return rooms.find((room) => room.id === wanted) ?? rooms.find((room) => room.id === ownRoomId);
}

export function parseRoomParam(value: string | string[] | undefined): string | null {
  const single = Array.isArray(value) ? value[0] : value;
  return single !== undefined && z.uuid().safeParse(single).success ? single : null;
}

export async function fetchCrmChat(client: Client, wanted: string | null): Promise<CrmChatResult> {
  try {
    const ensured = await client.rpc("ensure_my_conversation");
    if (ensured.error || typeof ensured.data !== "string") return { status: "error" };
    const ownRoomId = ensured.data;

    const list = await client
      .from("my_conversations")
      .select("*")
      .in("kind", ["closer", "client"])
      .order("last_activity_at", { ascending: false })
      .limit(100);
    if (list.error) return { status: "error" };
    const parsed = summariesSchema.safeParse(list.data);
    if (!parsed.success) return { status: "error" };

    const summary = pickRoom(parsed.data, ownRoomId, wanted);
    if (!summary) return { status: "error" };

    const [messages, members] = await Promise.all([
      listRoomMessages(client, summary.id, null),
      listRoomMembers(client, summary.id),
    ]);
    if (messages.status === "failed" || members === null) return { status: "error" };

    return {
      status: "ok",
      ownRoomId,
      rooms: parsed.data,
      selected: { summary, messages: messages.messages, members },
    };
  } catch {
    return { status: "error" };
  }
}
