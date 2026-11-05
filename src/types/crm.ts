import "@/lib/security/zod-jitless";

import { z } from "zod";

export const contactKinds = ["prospect", "client", "recruiter", "partner", "other"] as const;
export const contactSources = ["manual", "import", "form", "nexo", "whatsapp", "radar"] as const;
export const dealStages = ["new", "contacted", "meeting", "proposal", "won", "lost"] as const;
export const openDealStages = ["new", "contacted", "meeting", "proposal"] as const;
export const reachableStages = [...openDealStages, "lost"] as const;
export const dealVias = ["hiring", "freelance", "project"] as const;
export const ownerRoles = ["admin", "closer"] as const;

export type ContactKind = (typeof contactKinds)[number];
export type ContactSource = (typeof contactSources)[number];
export type DealStage = (typeof dealStages)[number];
export type ReachableStage = (typeof reachableStages)[number];
export type DealVia = (typeof dealVias)[number];

export const noOwnerFilter = "none";

export const dealSummarySchema = z.object({
  id: z.uuid(),
  stage: z.enum(dealStages),
  via: z.enum(dealVias),
  amount: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type DealSummary = z.infer<typeof dealSummarySchema>;

export const contactRowSchema = z.object({
  id: z.uuid(),
  full_name: z.string(),
  organization: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  kind: z.enum(contactKinds),
  source: z.enum(contactSources),
  owner_id: z.uuid().nullable(),
  next_action: z.string().nullable(),
  next_action_at: z.string().nullable(),
  last_activity_at: z.string().nullable(),
  created_at: z.string(),
  deals: z.array(dealSummarySchema),
});

export type ContactRow = z.infer<typeof contactRowSchema>;

export const ownerRowSchema = z.object({
  id: z.uuid(),
  full_name: z.string(),
  role: z.enum(ownerRoles),
  is_active: z.boolean(),
});

export interface ContactOwner {
  id: string;
  name: string;
  assignable: boolean;
}

export interface ContactFilters {
  q: string;
  kind: ContactKind | null;
  stage: DealStage | null;
  due: boolean;
  owner: string | null;
}

export type ContactsResult =
  | {
      status: "ok";
      rows: ContactRow[];
      owners: ContactOwner[];
      limit: number;
      nowIso: string;
    }
  | { status: "error" };

export const contactNameMax = 200;
export const contactEmailMax = 320;
export const contactPhoneMax = 40;
export const lostReasonMax = 500;

export const newContactSchema = z.strictObject({
  fullName: z.string().trim().min(1).max(contactNameMax),
  email: z.union([z.literal(""), z.email().max(contactEmailMax)]),
  phone: z.string().trim().max(contactPhoneMax),
  organization: z.string().trim().max(contactNameMax),
  kind: z.enum(contactKinds),
});

export type NewContactInput = z.infer<typeof newContactSchema>;

export type NewContactField = keyof NewContactInput;

export type NewContactResult =
  | { status: "done"; id: string }
  | { status: "invalid"; field: NewContactField }
  | { status: "duplicate" }
  | { status: "forbidden" }
  | { status: "error" };

export const changeStageSchema = z
  .strictObject({
    dealId: z.uuid(),
    stage: z.enum(reachableStages),
    reason: z.string().trim().max(lostReasonMax),
    expectedUpdatedAt: z.string().min(1).max(64),
  })
  .refine((value) => value.stage !== "lost" || value.reason !== "", { path: ["reason"] });

export type ChangeStageInput = z.infer<typeof changeStageSchema>;

export type ChangeStageResult =
  | { status: "done" }
  | { status: "invalid"; field: "stage" | "reason" }
  | { status: "stale" }
  | { status: "forbidden" }
  | { status: "error" };

export type NewContactHandler = (raw: unknown) => Promise<NewContactResult>;
export type ChangeStageHandler = (raw: unknown) => Promise<ChangeStageResult>;

export interface NewContactLabels {
  open: string;
  title: string;
  close: string;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  kind: string;
  optional: string;
  kinds: Record<ContactKind, string>;
  submit: string;
  saving: string;
  done: string;
  errors: {
    fullName: string;
    email: string;
    phone: string;
    organization: string;
    kind: string;
    duplicate: string;
    forbidden: string;
    error: string;
  };
}

export interface StageSheetLabels {
  open: string;
  openAria: string;
  title: string;
  close: string;
  stageLegend: string;
  stages: Record<ReachableStage, string>;
  reasonLabel: string;
  submit: string;
  saving: string;
  done: string;
  errors: {
    stage: string;
    reason: string;
    stale: string;
    forbidden: string;
    error: string;
  };
}

export interface ContactFilterLabels {
  region: string;
  search: string;
  searchPlaceholder: string;
  kind: string;
  stage: string;
  owner: string;
  all: string;
  noOwner: string;
  due: string;
  apply: string;
  clear: string;
  kinds: Record<ContactKind, string>;
  stages: Record<DealStage, string>;
}

export interface ContactTableLabels {
  region: string;
  caption: string;
  listLabel: string;
  columns: {
    name: string;
    organization: string;
    kind: string;
    stage: string;
    nextAction: string;
    lastContact: string;
    source: string;
    owner: string;
  };
  kinds: Record<ContactKind, string>;
  sources: Record<ContactSource, string>;
  stages: Record<DealStage, string>;
  vias: Record<DealVia, string>;
  noDeal: string;
  noNextAction: string;
  overdue: string;
  never: string;
  noOwner: string;
  unknownOwner: string;
  noEmail: string;
  call: string;
  whatsapp: string;
  callAria: string;
  whatsappAria: string;
  stageSheet: StageSheetLabels;
}
