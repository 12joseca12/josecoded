import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import {
  type RoomActionResult,
  type RoomMember,
  roomMemberSchema,
  type RoomMessage,
  roomMessageRowSchema,
  type RoomPollResult,
  type SendRoomMessageResult,
  sendRoomMessageSchema,
} from "@/types/room";

type Client = SupabaseClient<Database>;

const insufficientPrivilege = "42501";
const pageSize = 100;

export const messageColumns = "*, message_attachments(id, name, mime, size_bytes)";

function parseMessages(rows: unknown): RoomMessage[] | null {
  if (!Array.isArray(rows)) return null;
  const messages: RoomMessage[] = [];
  for (const row of rows) {
    const parsed = roomMessageRowSchema.safeParse(row);
    if (!parsed.success) return null;
    messages.push(parsed.data);
  }
  return messages;
}

export async function listRoomMessages(
  client: Client,
  conversationId: string,
  since: string | null,
): Promise<RoomPollResult> {
  try {
    const query = client
      .from("messages")
      .select(messageColumns)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: since !== null })
      .order("id", { ascending: since !== null })
      .limit(pageSize);
    const { data, error } = await (since === null ? query : query.gt("created_at", since));
    if (error) {
      return {
        status: "failed",
        problem: error.code === insufficientPrivilege ? "forbidden" : "error",
      };
    }
    const messages = parseMessages(data);
    if (messages === null) return { status: "failed", problem: "error" };
    return { status: "done", messages: since === null ? messages.reverse() : messages };
  } catch {
    return { status: "failed", problem: "error" };
  }
}

export async function sendRoomMessage(
  client: Client,
  userId: string,
  raw: unknown,
): Promise<SendRoomMessageResult> {
  const parsed = sendRoomMessageSchema.safeParse(raw);
  if (!parsed.success) return { status: "failed", problem: "invalid" };
  try {
    const { data, error } = await client
      .from("messages")
      .insert({
        conversation_id: parsed.data.conversationId,
        author_kind: "human",
        author_id: userId,
        body: parsed.data.body,
      })
      .select("*")
      .single();
    if (error) {
      return {
        status: "failed",
        problem: error.code === insufficientPrivilege ? "forbidden" : "error",
      };
    }
    const message = roomMessageRowSchema.safeParse(data);
    if (!message.success) return { status: "failed", problem: "error" };
    return { status: "done", message: message.data };
  } catch {
    return { status: "failed", problem: "error" };
  }
}

async function run(call: PromiseLike<{ error: { code?: string; message: string } | null }>) {
  try {
    const { error } = await call;
    if (!error) return { status: "done" } satisfies RoomActionResult;
    if (error.code === insufficientPrivilege)
      return { status: "failed", code: "forbidden" } as const;
    return {
      status: "failed",
      code: error.message.length <= 40 ? error.message : "error",
    } as const;
  } catch {
    return { status: "failed", code: "error" } as const;
  }
}

export function markRoomRead(client: Client, conversationId: string): Promise<RoomActionResult> {
  return run(client.rpc("mark_read", { p_conversation_id: conversationId }));
}

export function setConversationAi(
  client: Client,
  conversationId: string,
  enabled: boolean,
): Promise<RoomActionResult> {
  return run(
    client.rpc("set_conversation_ai", { p_conversation_id: conversationId, p_enabled: enabled }),
  );
}

export function archiveRoom(client: Client, conversationId: string): Promise<RoomActionResult> {
  return run(client.rpc("archive_conversation", { p_conversation_id: conversationId }));
}

export function setAiConsent(
  client: Client,
  conversationId: string,
  granted: boolean,
): Promise<RoomActionResult> {
  return run(
    client.rpc("set_ai_consent", { p_conversation_id: conversationId, p_granted: granted }),
  );
}

export function addRoomMember(
  client: Client,
  conversationId: string,
  userId: string,
  role: RoomMember["role"],
): Promise<RoomActionResult> {
  return run(
    client.rpc("add_member", {
      p_conversation_id: conversationId,
      p_user_id: userId,
      p_role: role,
    }),
  );
}

export function removeRoomMember(
  client: Client,
  conversationId: string,
  userId: string,
): Promise<RoomActionResult> {
  return run(client.rpc("remove_member", { p_conversation_id: conversationId, p_user_id: userId }));
}

export async function listRoomMembers(
  client: Client,
  conversationId: string,
): Promise<RoomMember[] | null> {
  try {
    const { data, error } = await client.rpc("list_room_members", {
      p_conversation_id: conversationId,
    });
    if (error || !Array.isArray(data)) return null;
    const members: RoomMember[] = [];
    for (const row of data) {
      const parsed = roomMemberSchema.safeParse(row);
      if (!parsed.success) return null;
      members.push(parsed.data);
    }
    return members;
  } catch {
    return null;
  }
}
