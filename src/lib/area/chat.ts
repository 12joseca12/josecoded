import { z } from "zod";

import { listRoomMembers, listRoomMessages } from "@/lib/chat/room";
import type { ServerSupabase } from "@/lib/supabase/server";
import {
  type RoomMember,
  type RoomMessage,
  type RoomSummary,
  roomSummarySchema,
} from "@/types/room";

export type AreaRoomResult =
  | {
      status: "ok";
      room: RoomSummary;
      messages: RoomMessage[];
      members: RoomMember[];
    }
  | { status: "none" }
  | { status: "error" };

export async function fetchProjectRoom(
  client: ServerSupabase,
  projectId: string,
): Promise<AreaRoomResult> {
  const { data, error } = await client
    .from("my_conversations")
    .select("*")
    .eq("kind", "client")
    .eq("project_id", projectId);
  if (error) return { status: "error" };
  const parsed = z.array(roomSummarySchema).safeParse(data);
  if (!parsed.success) return { status: "error" };
  const room = parsed.data.find((row) => row.kind === "client" && row.project_id === projectId);
  if (room === undefined) return { status: "none" };
  const [messages, members] = await Promise.all([
    listRoomMessages(client, room.id, null),
    listRoomMembers(client, room.id),
  ]);
  if (messages.status === "failed" || members === null) return { status: "error" };
  return { status: "ok", room, messages: messages.messages, members };
}

export function canWriteInRoom(members: readonly RoomMember[], userId: string): boolean {
  const own = members.find((member) => member.user_id === userId && member.left_at === null);
  return own?.can_write ?? false;
}
