import "@/lib/security/zod-jitless";

import { z } from "zod";

import type {
  AiSwitchLabels,
  ConsentBadgeLabels,
  MemberCandidate,
  MemberListLabels,
  RoomLabels,
  RoomMember,
  RoomMessage,
  RoomSummary,
} from "./room";

export const chatTabs = ["visitors", "people", "clients", "archived"] as const;
export type ChatTab = (typeof chatTabs)[number];

export const conversationDetailSchema = z.object({
  id: z.uuid(),
  kind: z.enum(["visitor", "closer", "client", "freelance"]),
  status: z.enum(["open", "archived"]),
  ai_enabled: z.boolean(),
  ai_off_reason: z.string().nullable(),
  lead_id: z.uuid().nullable(),
  contact_id: z.uuid().nullable(),
  first_page_path: z.string().nullable(),
});

export type ConversationDetail = z.infer<typeof conversationDetailSchema>;

export const chatLeadSchema = z.object({
  id: z.uuid(),
  full_name: z.string(),
  status: z.enum(["new", "assigned", "contacted", "converted", "discarded"]),
  contact_id: z.uuid().nullable(),
});

export type ChatLead = z.infer<typeof chatLeadSchema>;

export const candidateRowSchema = z.object({
  id: z.uuid(),
  full_name: z.string(),
  role: z.enum(["admin", "closer", "freelance", "client"]),
});

export type ChatListResult = { status: "ok"; rooms: RoomSummary[] } | { status: "error" };

export type ChatDetailResult =
  | { status: "missing" }
  | { status: "error" }
  | {
      status: "ok";
      summary: RoomSummary;
      conversation: ConversationDetail;
      messages: RoomMessage[];
      members: RoomMember[];
      candidates: MemberCandidate[];
      lead: ChatLead | null;
    };

export type CreateContactResult =
  { status: "done"; contactId: string | null } | { status: "failed"; code: string };

export interface ConversationListLabels {
  kinds: Record<RoomSummary["kind"], string>;
  visitor: string;
  noMessages: string;
  unread: string;
  nexoOn: string;
  nexoOff: string;
  archived: string;
  consent: ConsentBadgeLabels;
}

export interface CreateLeadLabels {
  title: string;
  none: string;
  ready: string;
  button: string;
  confirmTitle: string;
  confirmText: string;
  submit: string;
  saving: string;
  close: string;
  done: string;
  converted: string;
  openContact: string;
  openLead: string;
  errors: Record<string, string>;
}

export interface ChatPanelLabels {
  archive: {
    trigger: string;
    title: string;
    text: string;
    submit: string;
    saving: string;
    close: string;
    done: string;
    errors: Record<string, string>;
  };
  ai: AiSwitchLabels;
  consent: ConsentBadgeLabels;
  members: MemberListLabels;
  room: RoomLabels;
}
