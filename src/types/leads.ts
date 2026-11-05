import "@/lib/security/zod-jitless";

import { z } from "zod";

export const leadVias = ["hiring", "freelance", "project"] as const;
export const leadStatuses = ["new", "assigned", "contacted", "converted", "discarded"] as const;

export const leadRowSchema = z.object({
  id: z.uuid(),
  via: z.enum(leadVias).nullable(),
  full_name: z.string(),
  email: z.string().nullable(),
  status: z.enum(leadStatuses),
  created_at: z.string(),
  assigned_to: z.uuid().nullable(),
  discard_reason: z.string().nullable(),
  offer: z.string().nullable(),
});

export type LeadRow = z.infer<typeof leadRowSchema>;

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
  { status: "ok"; rows: LeadRow[]; assignees: LeadAssignee[]; limit: number } | { status: "error" };

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

export interface LeadTableLabels {
  region: string;
  caption: string;
  columns: {
    via: string;
    name: string;
    email: string;
    status: string;
    assigned: string;
    date: string;
    actions: string;
  };
  via: Record<(typeof leadVias)[number] | "none", string>;
  status: Record<(typeof leadStatuses)[number], string>;
  noEmail: string;
  unassigned: string;
  unknownAssignee: string;
  actions: LeadActionLabels;
}
