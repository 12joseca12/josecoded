import "@/lib/security/zod-jitless";

import { z } from "zod";

import {
  type ContactKind,
  type ContactOwner,
  contactRowSchema,
  type ContactSource,
  type DealStage,
  dealSummarySchema,
  type DealVia,
  type StageSheetLabels,
} from "./crm";

export const activityKinds = [
  "note",
  "call",
  "meeting",
  "email",
  "whatsapp",
  "stage_change",
  "form",
  "chat",
  "system",
] as const;
export const loggableKinds = ["note", "call", "meeting", "email", "whatsapp"] as const;

export type ActivityKind = (typeof activityKinds)[number];
export type LoggableKind = (typeof loggableKinds)[number];

export const activityBodyMax = 10000;

export const dealDetailSchema = dealSummarySchema.extend({
  won_amount: z.number().nullable(),
  won_at: z.string().nullable(),
  lost_reason: z.string().nullable(),
  lost_at: z.string().nullable(),
});

export type DealDetail = z.infer<typeof dealDetailSchema>;

export const contactDetailSchema = contactRowSchema.omit({ deals: true }).extend({
  role_title: z.string().nullable(),
  city: z.string().nullable(),
  website: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  tags: z.array(z.string()),
  notes: z.string().nullable(),
  deals: z.array(dealDetailSchema),
});

export type ContactDetail = z.infer<typeof contactDetailSchema>;

export const activityRowSchema = z.object({
  id: z.uuid(),
  kind: z.enum(activityKinds),
  body: z.string().nullable(),
  occurred_at: z.string(),
  author_id: z.uuid().nullable(),
  deal_id: z.uuid().nullable(),
});

export type ActivityRow = z.infer<typeof activityRowSchema>;

export type ContactDetailResult =
  | {
      status: "ok";
      contact: ContactDetail;
      activities: ActivityRow[];
      people: ContactOwner[];
    }
  | { status: "missing" }
  | { status: "error" };

export const addActivitySchema = z.strictObject({
  contactId: z.uuid(),
  dealId: z.union([z.literal(""), z.uuid()]),
  kind: z.enum(loggableKinds),
  body: z.string().trim().min(1).max(activityBodyMax),
});

export type AddActivityField = "kind" | "body" | "dealId";

export type AddActivityResult =
  | { status: "done" }
  | { status: "invalid"; field: AddActivityField }
  | { status: "forbidden" }
  | { status: "error" };

export const reassignSchema = z.strictObject({
  contactId: z.uuid(),
  ownerId: z.uuid(),
});

export type ReassignResult =
  { status: "done" } | { status: "invalid" } | { status: "forbidden" } | { status: "error" };

export type AddActivityHandler = (raw: unknown) => Promise<AddActivityResult>;
export type ReassignHandler = (raw: unknown) => Promise<ReassignResult>;

export interface ActivityComposerLabels {
  title: string;
  kind: string;
  kinds: Record<LoggableKind, string>;
  deal: string;
  noDeal: string;
  body: string;
  submit: string;
  saving: string;
  done: string;
  errors: { kind: string; body: string; dealId: string; forbidden: string; error: string };
}

export interface ActivityTimelineLabels {
  title: string;
  listLabel: string;
  emptyTitle: string;
  emptyText: string;
  kinds: Record<ActivityKind, string>;
  system: string;
  unknownAuthor: string;
}

export interface ReassignLabels {
  open: string;
  title: string;
  close: string;
  owner: string;
  placeholder: string;
  note: string;
  submit: string;
  saving: string;
  done: string;
  errors: { owner: string; forbidden: string; error: string };
}

export interface DealCardLabels {
  stages: Record<DealStage, string>;
  vias: Record<DealVia, string>;
  amount: string;
  noAmount: string;
  wonAmount: string;
  wonAt: string;
  lostAt: string;
  lostReason: string;
  created: string;
  lose: string;
  loseAria: string;
  reopen: string;
  reopenAria: string;
  stageSheet: StageSheetLabels;
}

export interface ContactHeadLabels {
  kinds: Record<ContactKind, string>;
  sources: Record<ContactSource, string>;
  source: string;
  email: string;
  noEmail: string;
  copy: string;
  copyAria: string;
  copied: string;
  phone: string;
  call: string;
  whatsapp: string;
  callAria: string;
  whatsappAria: string;
  city: string;
  website: string;
  owner: string;
  noOwner: string;
  unknownOwner: string;
  nextStep: string;
  noNextStep: string;
  overdue: string;
  lastContact: string;
  never: string;
  tags: string;
  notes: string;
}
