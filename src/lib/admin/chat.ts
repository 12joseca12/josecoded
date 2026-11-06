import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { listRoomMembers, listRoomMessages } from "@/lib/chat/room";
import {
  candidateRowSchema,
  type ChatDetailResult,
  chatLeadSchema,
  type ChatListResult,
  type ChatTab,
  conversationDetailSchema,
} from "@/types/admin-chat";
import type { Database } from "@/types/database";
import { type MemberCandidate, type RoomSummary, roomSummarySchema } from "@/types/room";

type Client = SupabaseClient<Database>;

export const chatListLimit = 200;

const summariesSchema = z.array(roomSummarySchema);
const candidatesSchema = z.array(candidateRowSchema);

export function tabOf(room: RoomSummary): ChatTab {
  if (room.status === "archived") return "archived";
  if (room.kind === "visitor") return "visitors";
  if (room.kind === "client") return "clients";
  return "people";
}

export function countByTab(rooms: RoomSummary[]): Record<ChatTab, number> {
  const counts: Record<ChatTab, number> = { visitors: 0, people: 0, clients: 0, archived: 0 };
  for (const room of rooms) counts[tabOf(room)] += 1;
  return counts;
}

export function parseChatTab(value: string | string[] | undefined): ChatTab {
  const single = Array.isArray(value) ? value[0] : value;
  return single === "people" || single === "clients" || single === "archived" ? single : "visitors";
}

export async function fetchChatList(client: Client): Promise<ChatListResult> {
  try {
    const { data, error } = await client
      .from("my_conversations")
      .select("*")
      .order("last_activity_at", { ascending: false })
      .limit(chatListLimit);
    if (error) return { status: "error" };
    const parsed = summariesSchema.safeParse(data);
    return parsed.success ? { status: "ok", rooms: parsed.data } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

const detailColumns =
  "id, kind, status, ai_enabled, ai_off_reason, lead_id, contact_id, first_page_path";

export async function fetchChatDetail(client: Client, id: string): Promise<ChatDetailResult> {
  try {
    const [summary, conversation] = await Promise.all([
      client.from("my_conversations").select("*").eq("id", id).maybeSingle(),
      client.from("conversations").select(detailColumns).eq("id", id).maybeSingle(),
    ]);
    if (summary.error || conversation.error) return { status: "error" };
    if (!summary.data || !conversation.data) return { status: "missing" };
    const summaryRow = roomSummarySchema.safeParse(summary.data);
    const detail = conversationDetailSchema.safeParse(conversation.data);
    if (!summaryRow.success || !detail.success) return { status: "error" };

    const [messages, members, candidates, lead] = await Promise.all([
      listRoomMessages(client, id, null),
      listRoomMembers(client, id),
      client
        .from("profiles")
        .select("id, full_name, role")
        .in("role", ["closer", "freelance", "client"])
        .eq("is_active", true)
        .order("full_name"),
      detail.data.lead_id
        ? client
            .from("leads")
            .select("id, full_name, status, contact_id")
            .eq("id", detail.data.lead_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (messages.status === "failed" || members === null || candidates.error || lead.error) {
      return { status: "error" };
    }
    const people = candidatesSchema.safeParse(candidates.data);
    const leadRow = lead.data ? chatLeadSchema.safeParse(lead.data) : null;
    if (!people.success || (leadRow && !leadRow.success)) return { status: "error" };

    const options: MemberCandidate[] = people.data
      .filter((person) => person.role !== "admin")
      .filter((person) => person.role !== "client" || detail.data.kind === "client")
      .map((person) => ({
        userId: person.id,
        name: person.full_name,
        role: person.role === "admin" ? "owner" : person.role,
      }));

    return {
      status: "ok",
      summary: summaryRow.data,
      conversation: detail.data,
      messages: messages.messages,
      members,
      candidates: options,
      lead: leadRow?.success ? leadRow.data : null,
    };
  } catch {
    return { status: "error" };
  }
}
