import type { SupabaseClient } from "@supabase/supabase-js";

import { removeChatFiles, uploadChatFile } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";
import {
  type RoomAttachment,
  roomBodyMax,
  type RoomMessage,
  type SendRoomMessageResult,
} from "@/types/room";

import { attachmentPath, cleanName, validateFiles } from "./attachments";
import { sendRoomMessage } from "./room";

type Client = SupabaseClient<Database>;

export interface AttachmentInput {
  conversationId: string;
  body: string;
  files: File[];
}

export async function sendWithAttachments(
  client: Client,
  service: Client,
  userId: string,
  input: AttachmentInput,
): Promise<SendRoomMessageResult> {
  const problem = validateFiles(input.files);
  if (problem !== null) return { status: "failed", problem };

  const names = input.files.map((file) => cleanName(file.name));
  const body = input.body.trim() === "" ? names.join(", ") : input.body;
  if (body.length > roomBodyMax) return { status: "failed", problem: "invalid" };

  const sent = await sendRoomMessage(client, userId, {
    conversationId: input.conversationId,
    body,
  });
  if (sent.status === "failed") return sent;

  const stored: RoomAttachment[] = [];
  const paths: string[] = [];
  for (const [index, file] of input.files.entries()) {
    const id = crypto.randomUUID();
    const path = attachmentPath(input.conversationId, id);
    const name = names[index] ?? "archivo";
    if (!(await uploadChatFile(service, path, file))) {
      await removeChatFiles(service, paths);
      await dropRows(service, stored);
      return { status: "failed", problem: "attachments_failed" };
    }
    paths.push(path);
    const { error } = await service.rpc("register_attachment", {
      p_message_id: sent.message.id,
      p_uploaded_by: userId,
      p_name: name,
      p_mime: file.type,
      p_size: file.size,
      p_path: path,
    });
    if (error) {
      await removeChatFiles(service, paths);
      await dropRows(service, stored);
      return { status: "failed", problem: "attachments_failed" };
    }
    stored.push({ id, name, mime: file.type, size_bytes: file.size });
  }

  const message: RoomMessage = { ...sent.message, attachments: stored };
  return { status: "done", message };
}

async function dropRows(service: Client, rows: RoomAttachment[]): Promise<void> {
  if (rows.length === 0) return;
  try {
    await service
      .from("message_attachments")
      .delete()
      .in(
        "id",
        rows.map((row) => row.id),
      );
  } catch {
    return;
  }
}
