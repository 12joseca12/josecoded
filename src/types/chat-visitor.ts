import "@/lib/security/zod-jitless";

import { z } from "zod";

import { locales } from "@/i18n/config";

import { chatBubbleVariants, chatMaxLength, chatSystemEvents, handoffInputSchema } from "./chat";

export const chatSendRequestSchema = z.strictObject({
  body: z.string().trim().min(1, "message_required").max(chatMaxLength, "message_too_long"),
  pagePath: z
    .string()
    .max(500)
    .regex(/^\/\S*$/)
    .nullable()
    .optional(),
  locale: z.enum(locales),
  turnstileToken: z.string().min(1).max(2048).optional(),
});
export type ChatSendRequest = z.infer<typeof chatSendRequestSchema>;

export const chatHandoffRequestSchema = handoffInputSchema;

export const chatSendStatuses = [
  "sent",
  "invalid",
  "verification_failed",
  "burst",
  "quota",
  "closed",
  "unavailable",
] as const;
export type ChatSendStatus = (typeof chatSendStatuses)[number];

export const chatSendResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("sent"), messageId: z.string() }),
  z.object({ status: z.literal("invalid") }),
  z.object({ status: z.literal("verification_failed") }),
  z.object({ status: z.literal("burst") }),
  z.object({ status: z.literal("quota") }),
  z.object({ status: z.literal("closed") }),
  z.object({ status: z.literal("unavailable") }),
]);
export type ChatSendResponse = z.infer<typeof chatSendResponseSchema>;

export const visitorSendRowsSchema = z
  .array(z.object({ conversation_id: z.guid(), message_id: z.guid() }))
  .min(1);

export const visitorThreadRowSchema = z.object({
  id: z.guid(),
  author_kind: z.enum(["human", "nexo", "system"]),
  from_staff: z.boolean(),
  kind: z.string(),
  system_event: z.string().nullable(),
  body: z.string(),
  sources: z.array(z.string()).nullable(),
  auto: z.boolean().nullable(),
  created_at: z.string(),
});

export const visitorThreadSchema = z.object({
  messages: z.array(visitorThreadRowSchema),
  nexo_online: z.boolean(),
  ai_enabled: z.boolean(),
  pending_reply: z.boolean(),
  handoff_done: z.boolean(),
  consent_at: z.string().nullable(),
  status: z.enum(["open", "archived"]).nullable(),
});
export type VisitorThread = z.infer<typeof visitorThreadSchema>;
export type VisitorThreadRow = z.infer<typeof visitorThreadRowSchema>;

export const chatWireMessageSchema = z.object({
  id: z.string(),
  author: z.enum(chatBubbleVariants),
  body: z.string(),
  sources: z.array(z.string()),
  systemEvent: z.enum(chatSystemEvents).nullable(),
  createdAt: z.string(),
});
export type ChatWireMessage = z.infer<typeof chatWireMessageSchema>;

export const chatWireStateSchema = z.object({
  nexoOnline: z.boolean(),
  aiEnabled: z.boolean(),
  pendingReply: z.boolean(),
  handoffDone: z.boolean(),
  closed: z.boolean(),
});
export type ChatWireState = z.infer<typeof chatWireStateSchema>;

export const chatWireThreadSchema = z.object({
  messages: z.array(chatWireMessageSchema),
  state: chatWireStateSchema,
});
export type ChatWireThread = z.infer<typeof chatWireThreadSchema>;

export const chatThreadQuerySchema = z.object({
  since: z.iso.datetime({ offset: true }).optional(),
});

export const chatStreamEvents = [
  "ready",
  "message",
  "thinking",
  "takeover",
  "offline",
  "handoff",
  "closed",
] as const;
export type ChatStreamEvent = (typeof chatStreamEvents)[number];

export const chatHandoffResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("saved") }),
  z.object({
    status: z.literal("invalid"),
    errors: z.record(z.string(), z.string()),
  }),
  z.object({ status: z.literal("closed") }),
  z.object({ status: z.literal("verification_failed") }),
  z.object({ status: z.literal("quota") }),
  z.object({ status: z.literal("unavailable") }),
]);
export type ChatHandoffResponse = z.infer<typeof chatHandoffResponseSchema>;
