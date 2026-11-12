import "@/lib/security/zod-jitless";

import { z } from "zod";

export const leadVias = ["hiring", "freelance", "project"] as const;
export const leadStatuses = ["new", "assigned", "contacted", "converted", "discarded"] as const;
export const leadSources = ["form", "nexo", "whatsapp", "radar", "manual"] as const;
export const manualLeadSources = ["manual", "whatsapp"] as const;
export const leadTabs = ["all", "new", "waiting", "assigned", "converted", "discarded"] as const;
export type LeadTab = (typeof leadTabs)[number];

export const leadRowSchema = z.object({
  id: z.uuid(),
  via: z.enum(leadVias).nullable(),
  source: z.enum(leadSources),
  full_name: z.string(),
  email: z.string().nullable(),
  organization: z.string().nullable(),
  contact_id: z.uuid().nullable(),
  status: z.enum(leadStatuses),
  created_at: z.string(),
  assigned_to: z.uuid().nullable(),
  discard_reason: z.string().nullable(),
  offer: z.string().nullable(),
});

export type LeadRow = z.infer<typeof leadRowSchema>;

export type LeadListRow = LeadRow & { submissionCount: number };

export const leadDetailSchema = leadRowSchema.extend({
  phone: z.string().nullable(),
  message: z.string().nullable(),
  locale: z.enum(["es", "en"]).nullable(),
  page_path: z.string().nullable(),
  consent_at: z.string().nullable(),
  assigned_at: z.string().nullable(),
  assigned_by: z.uuid().nullable(),
  deal_id: z.uuid().nullable(),
  company: z.string().nullable(),
  offer_url: z.string().nullable(),
  wanted_by: z.string().nullable(),
  has_domain: z.boolean().nullable(),
  has_store_accounts: z.boolean().nullable(),
  extras: z.array(z.string()),
  offer_answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])).nullable(),
});

export type LeadDetailRow = z.infer<typeof leadDetailSchema>;

export interface LeadFilters {
  tab: LeadTab;
  via: (typeof leadVias)[number] | "none" | null;
  source: (typeof leadSources)[number] | null;
  owner: string | null;
  q: string;
}

export const newLeadSchema = z
  .strictObject({
    source: z.enum(manualLeadSources),
    via: z.enum(leadVias).nullable(),
    fullName: z.string().trim().min(1).max(200),
    email: z.email().max(320).nullable(),
    phone: z.string().trim().min(1).max(40).nullable(),
    organization: z.string().trim().min(1).max(200).nullable(),
    message: z.string().trim().min(1).max(4000).nullable(),
    assignedTo: z.uuid().nullable(),
  })
  .refine((value) => value.email !== null || value.phone !== null, {
    path: ["email"],
    message: "reachable",
  });

export type NewLeadInput = z.infer<typeof newLeadSchema>;

export type NewLeadField =
  "fullName" | "email" | "phone" | "organization" | "message" | "assignedTo";

export type NewLeadResult =
  | { status: "done"; id: string }
  | { status: "invalid"; fields: NewLeadField[] }
  | { status: "forbidden" }
  | { status: "error" };

export type NewLeadHandler = (raw: unknown) => Promise<NewLeadResult>;

export const assigneeRowSchema = z.object({
  id: z.uuid(),
  full_name: z.string(),
  role: z.enum(["admin", "closer"]),
  is_active: z.boolean(),
});

export interface LeadAssignee {
  id: string;
  name: string;
  assignable: boolean;
}

export const discardReasonMax = 500;

export const assignLeadSchema = z.strictObject({
  leadId: z.uuid(),
  userId: z.uuid(),
});

export const discardLeadSchema = z.strictObject({
  leadId: z.uuid(),
  reason: z.string().trim().min(1).max(discardReasonMax),
});

export type LeadActionResult =
  | { status: "done" }
  | { status: "invalid"; field: "assignee" | "reason" }
  | { status: "stale" }
  | { status: "forbidden" }
  | { status: "error" };

export type LeadsResult =
  | { status: "ok"; rows: LeadListRow[]; assignees: LeadAssignee[]; limit: number }
  | { status: "error" };

export type LeadDetailResult =
  | {
      status: "ok";
      lead: LeadDetailRow;
      assignees: LeadAssignee[];
      dealStage: string | null;
      submissionCount: number;
    }
  | { status: "missing" }
  | { status: "error" };

export type LeadActionHandler = (raw: unknown) => Promise<LeadActionResult>;

export interface LeadActionLabels {
  assignLabel: string;
  assignPlaceholder: string;
  assign: string;
  assigning: string;
  noAssignees: string;
  discardOpen: string;
  discardReasonLabel: string;
  discardSubmit: string;
  discarding: string;
  reasonPrefix: string;
  done: { assign: string; discard: string };
  errors: {
    assignee: string;
    reason: string;
    stale: string;
    forbidden: string;
    error: string;
  };
}

export interface NewLeadLabels {
  open: string;
  title: string;
  close: string;
  source: string;
  sources: Record<(typeof manualLeadSources)[number], string>;
  via: string;
  viaNone: string;
  vias: Record<(typeof leadVias)[number], string>;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  message: string;
  assignedTo: string;
  assignedNone: string;
  optional: string;
  submit: string;
  submitting: string;
  done: string;
  detail: string;
  errors: Record<NewLeadField | "reachable" | "forbidden" | "error", string>;
}

export const dealStages = ["new", "contacted", "meeting", "proposal", "won", "lost"] as const;

export interface LeadDetailLabels {
  message: { title: string; empty: string };
  contact: { title: string; email: string; phone: string; organization: string; none: string };
  origin: {
    title: string;
    source: string;
    via: string;
    created: string;
    page: string;
    locale: string;
    consent: string;
    consentYes: string;
    consentNo: string;
    locales: Record<"es" | "en", string>;
  };
  offer: {
    title: string;
    offer: string;
    extras: string;
    answers: string;
    company: string;
    offerUrl: string;
    wantedBy: string;
    hasDomain: string;
    hasStoreAccounts: string;
    yes: string;
    no: string;
  };
  owner: {
    title: string;
    status: string;
    assignedTo: string;
    assignedBy: string;
    assignedAt: string;
    automatic: string;
    waiting: string;
    contact: string;
    contactLink: string;
    deal: string;
    dealNone: string;
  };
  stage: Record<(typeof dealStages)[number], string>;
  table: LeadTableLabels;
}

export interface LeadTableLabels {
  region: string;
  caption: string;
  columns: {
    via: string;
    name: string;
    email: string;
    organization: string;
    source: string;
    status: string;
    assigned: string;
    date: string;
    actions: string;
  };
  via: Record<(typeof leadVias)[number] | "none", string>;
  status: Record<(typeof leadStatuses)[number], string>;
  noEmail: string;
  noOrganization: string;
  sources: Record<(typeof leadSources)[number], string>;
  unassigned: string;
  unknownAssignee: string;
  repeat: { label: string; link: string };
  actions: LeadActionLabels;
}
