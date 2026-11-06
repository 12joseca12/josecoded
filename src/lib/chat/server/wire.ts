import { type ChatBubbleVariant, type ChatSystemEvent, chatSystemEvents } from "@/types/chat";
import {
  type ChatWireMessage,
  type ChatWireState,
  type ChatWireThread,
  type VisitorThread,
  type VisitorThreadRow,
} from "@/types/chat-visitor";

function authorOf(row: VisitorThreadRow): ChatBubbleVariant {
  if (row.author_kind === "nexo") return "nexo";
  if (row.author_kind === "system") return "system";
  return row.from_staff ? "staff" : "visitor";
}

function systemEventOf(value: string | null): ChatSystemEvent | null {
  return chatSystemEvents.find((event) => event === value) ?? null;
}

export function toWireMessages(rows: readonly VisitorThreadRow[]): ChatWireMessage[] {
  const messages: ChatWireMessage[] = [];
  for (const row of rows) {
    const author = authorOf(row);
    const systemEvent = systemEventOf(row.system_event);
    if (author === "system" && systemEvent === null) continue;
    messages.push({
      id: row.id,
      author,
      body: row.body,
      sources: row.sources ?? [],
      systemEvent,
      createdAt: row.created_at,
    });
  }
  return messages;
}

export function toWireState(thread: VisitorThread): ChatWireState {
  return {
    nexoOnline: thread.nexo_online,
    aiEnabled: thread.ai_enabled,
    pendingReply: thread.pending_reply,
    handoffDone: thread.handoff_done,
    closed: thread.status === "archived",
  };
}

export function toWireThread(thread: VisitorThread): ChatWireThread {
  return { messages: toWireMessages(thread.messages), state: toWireState(thread) };
}

export function lastCreatedAt(thread: VisitorThread): string | null {
  return thread.messages.at(-1)?.created_at ?? null;
}
