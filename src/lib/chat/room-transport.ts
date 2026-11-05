import { z } from "zod";

import { roomMessageSchema, type RoomPollResult, type RoomTransport } from "@/types/room";

import { markRoomReadAction, sendRoomMessageAction } from "./room-actions";

const pollSchema = z.object({ status: z.literal("done"), messages: z.array(roomMessageSchema) });

export function createHttpRoomTransport(conversationId: string): RoomTransport {
  return {
    async poll(since): Promise<RoomPollResult> {
      try {
        const query = since === null ? "" : `?since=${encodeURIComponent(since)}`;
        const response = await fetch(`/api/rooms/${conversationId}/messages${query}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (response.status === 403) return { status: "failed", problem: "forbidden" };
        if (!response.ok) return { status: "failed", problem: "error" };
        const parsed = pollSchema.safeParse(await response.json());
        if (!parsed.success) return { status: "failed", problem: "error" };
        return { status: "done", messages: parsed.data.messages };
      } catch {
        return { status: "failed", problem: "error" };
      }
    },
    send: (body) => sendRoomMessageAction({ conversationId, body }),
    markRead: () => markRoomReadAction(conversationId),
  };
}
