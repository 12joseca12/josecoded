import type { ChatMessage, HandoffInput } from "@/types/chat";
import {
  type ChatHandoffResponse,
  chatHandoffResponseSchema,
  type ChatSendRequest,
  type ChatSendResponse,
  chatSendResponseSchema,
  type ChatWireMessage,
  type ChatWireThread,
  chatWireThreadSchema,
} from "@/types/chat-visitor";

const unavailable = { status: "unavailable" } as const;

async function post<T>(
  url: string,
  body: object,
  parse: (value: unknown) => T | null,
): Promise<T | { status: "unavailable" }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    if (response.status === 404) return unavailable;
    return parse(await response.json()) ?? unavailable;
  } catch {
    return unavailable;
  }
}

export function sendMessage(request: ChatSendRequest): Promise<ChatSendResponse> {
  return post("/api/chat/send", request, (value) => {
    const parsed = chatSendResponseSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
  });
}

export function sendHandoff(input: HandoffInput): Promise<ChatHandoffResponse> {
  return post("/api/chat/handoff", input, (value) => {
    const parsed = chatHandoffResponseSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
  });
}

export async function loadThread(since: string | null): Promise<ChatWireThread | null> {
  try {
    const query = since === null ? "" : `?since=${encodeURIComponent(since)}`;
    const response = await fetch(`/api/chat/thread${query}`, { credentials: "same-origin" });
    if (!response.ok) return null;
    const parsed = chatWireThreadSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function fromWire(message: ChatWireMessage): ChatMessage {
  return {
    id: message.id,
    variant: message.author,
    body: message.body,
    authorName: null,
    sources: message.sources,
    createdAt: message.createdAt,
    systemEvent: message.systemEvent,
    delivery: "sent",
  };
}
