import { z } from "zod";

import {
  roomMessageSchema,
  type RoomPollResult,
  type RoomProblem,
  type RoomTransport,
  type SendProgress,
  type SendRoomMessageResult,
} from "@/types/room";

import { markRoomReadAction, sendRoomMessageAction } from "./room-actions";

const sendSchema = z.union([
  z.object({ status: z.literal("done"), message: roomMessageSchema }),
  z.object({ status: z.literal("failed"), problem: z.string() }),
]);

const problems = new Set<string>([
  "forbidden",
  "archived",
  "invalid",
  "error",
  "too_many",
  "too_large",
  "type",
  "attachments_failed",
]);

function sendWithFiles(
  conversationId: string,
  body: string,
  files: File[],
  onProgress?: SendProgress,
): Promise<SendRoomMessageResult> {
  return new Promise((resolve) => {
    const failed = (problem: RoomProblem) => {
      resolve({ status: "failed", problem });
    };
    const request = new XMLHttpRequest();
    request.open("POST", "/api/chat/attachments");
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    request.onerror = () => {
      failed("error");
    };
    request.onload = () => {
      const parsed = sendSchema.safeParse(request.response);
      if (!parsed.success) {
        failed("error");
        return;
      }
      if (parsed.data.status === "done") {
        resolve({ status: "done", message: parsed.data.message });
        return;
      }
      const { problem } = parsed.data;
      failed(problems.has(problem) ? (problem as RoomProblem) : "error");
    };
    const form = new FormData();
    form.set("conversationId", conversationId);
    form.set("body", body);
    for (const file of files) form.append("files", file);
    request.send(form);
  });
}

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
    send: (body, files, onProgress) =>
      files && files.length > 0
        ? sendWithFiles(conversationId, body, files, onProgress)
        : sendRoomMessageAction({ conversationId, body }),
    markRead: () => markRoomReadAction(conversationId),
  };
}
