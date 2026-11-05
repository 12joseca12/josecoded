import "@/lib/security/zod-jitless";

import { z } from "zod";

export const roomZones = ["admin", "crm", "area"] as const;
export type RoomZone = (typeof roomZones)[number];

export const systemEvents = [
  "member_added",
  "member_left",
  "ai_on",
  "ai_off",
  "consent_granted",
  "consent_revoked",
  "archived",
  "handoff_done",
] as const;
export type SystemEvent = (typeof systemEvents)[number];

export const memberRoles = ["owner", "closer", "client", "freelance"] as const;
export type MemberRole = (typeof memberRoles)[number];

export const consentStates = ["granted", "revoked", "pending", "n/a"] as const;
export type ConsentState = (typeof consentStates)[number];

export const roomBodyMax = 4000;

export const roomMessageSchema = z.object({
  id: z.uuid(),
  conversation_id: z.uuid(),
  author_kind: z.enum(["human", "nexo", "system"]),
  author_id: z.uuid().nullable(),
  kind: z.enum(["text", "handoff", "reference"]),
  system_event: z.enum(systemEvents).nullable(),
  body: z.string(),
  sources: z.array(z.string()).default([]),
  auto: z.boolean().default(false),
  created_at: z.string(),
});

export type RoomMessage = z.infer<typeof roomMessageSchema>;

export const roomMemberSchema = z.object({
  user_id: z.uuid(),
  role: z.enum(memberRoles),
  full_name: z.string(),
  can_write: z.boolean(),
  joined_at: z.string(),
  left_at: z.string().nullable(),
});

export type RoomMember = z.infer<typeof roomMemberSchema>;

export const roomSummarySchema = z.object({
  id: z.uuid(),
  kind: z.enum(["visitor", "closer", "client", "freelance"]),
  status: z.enum(["open", "archived"]),
  last_activity_at: z.string(),
  last_message_excerpt: z.string().nullable(),
  unread_count: z.number(),
  ai_active: z.boolean(),
  ai_enabled: z.boolean(),
  consent_state: z.enum(consentStates),
  counterpart_name: z.string().nullable(),
  first_page_path: z.string().nullable(),
  project_id: z.uuid().nullable(),
});

export type RoomSummary = z.infer<typeof roomSummarySchema>;

export const sendRoomMessageSchema = z.object({
  conversationId: z.uuid(),
  body: z.string().trim().min(1).max(roomBodyMax),
});

export const sinceSchema = z
  .string()
  .max(64)
  .regex(/^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:\d{2})$/);

export type RoomProblem = "forbidden" | "archived" | "invalid" | "error";

export type SendRoomMessageResult =
  { status: "done"; message: RoomMessage } | { status: "failed"; problem: RoomProblem };

export type RoomPollResult =
  | { status: "done"; messages: RoomMessage[] }
  | { status: "failed"; problem: "forbidden" | "error" };

export type RoomActionResult = { status: "done" } | { status: "failed"; code: string };

export interface RoomTransport {
  poll: (since: string | null) => Promise<RoomPollResult>;
  send: (body: string) => Promise<SendRoomMessageResult>;
  markRead: () => Promise<void>;
}

export interface RoomLabels {
  threadLabel: string;
  empty: string;
  composerLabel: string;
  placeholder: string;
  send: string;
  sending: string;
  readOnly: string;
  archived: string;
  count: string;
  errors: Record<RoomProblem | "poll", string>;
  authors: { nexo: string; visitor: string; someone: string; you: string };
  auto: string;
  system: Record<SystemEvent, string> & { ai_off_takeover: string };
}

export interface MemberListLabels {
  title: string;
  empty: string;
  roles: Record<MemberRole, string>;
  remove: string;
  removeAria: string;
  confirmTitle: string;
  confirmText: string;
  confirmSubmit: string;
  saving: string;
  close: string;
  removed: string;
  add: string;
  addSelect: string;
  addPlaceholder: string;
  addButton: string;
  adding: string;
  added: string;
  errors: Record<string, string>;
}

export interface AiSwitchLabels {
  label: string;
  on: string;
  off: string;
  offTakeover: string;
  saving: string;
  changed: string;
  errors: Record<string, string>;
}

export interface ConsentBadgeLabels {
  label: string;
  states: Record<"granted" | "revoked" | "pending", string>;
}
