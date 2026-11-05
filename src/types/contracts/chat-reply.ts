import { z } from "zod";

export const chatReplyPayloadSchema = z.object({
  conversation_id: z.uuid(),
  message_id: z.uuid(),
  kind: z.enum(["visitor", "closer", "client", "freelance"]),
  locale: z.enum(["es", "en"]),
  page_path: z.string().max(500).nullable(),
  project_id: z.uuid().nullable(),
  mention: z.boolean(),
  delayed: z.boolean(),
});

export type ChatReplyPayload = z.infer<typeof chatReplyPayloadSchema>;
