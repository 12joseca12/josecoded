import "@/lib/security/zod-jitless";

import { z } from "zod";

import { leadRowSchema, type leadStatuses, leadVias } from "./leads";

export const inboxTabs = ["inbox", "mine", "team"] as const;
export type InboxTab = (typeof inboxTabs)[number];

export const inboxRowSchema = z.object({
  id: z.uuid(),
  first_name: z.string(),
  via: z.enum(leadVias).nullable(),
  offer: z.string().nullable(),
  extras: z.array(z.string()).nullable(),
  created_at: z.string(),
  excerpt: z.string().nullable(),
  locale: z.enum(["es", "en"]).nullable(),
});

export type InboxRow = z.infer<typeof inboxRowSchema>;

export const ownLeadRowSchema = leadRowSchema.extend({
  phone: z.string().nullable(),
});

export type OwnLeadRow = z.infer<typeof ownLeadRowSchema>;

export interface OwnLeadItem {
  row: OwnLeadRow;
  dateText: string;
  offerText: string | null;
}

export const teamMemberSchema = z.object({
  id: z.uuid(),
  full_name: z.string(),
});

export const claimLeadSchema = z.strictObject({ leadId: z.uuid() });

export type ClaimResult =
  | { status: "done"; contactId: string }
  | { status: "handoff" }
  | { status: "stale" }
  | { status: "quota" }
  | { status: "forbidden" }
  | { status: "error" };

export type ClaimHandler = (raw: unknown) => Promise<ClaimResult>;

export type InboxResult =
  | {
      status: "ok";
      inbox: InboxRow[];
      mine: OwnLeadRow[];
      team: OwnLeadRow[];
      people: Record<string, string>;
      hasTeam: boolean;
      limit: number;
    }
  | { status: "error" };

export interface InboxCardData {
  id: string;
  name: string;
  viaLabel: string | null;
  offerText: string | null;
  extrasText: string | null;
  excerpt: string | null;
  createdAt: string;
  dateText: string;
  localeLabel: string | null;
}

export interface InboxLabels {
  listLabel: string;
  claim: string;
  claiming: string;
  claimAria: string;
  extras: string;
  noMessage: string;
  notices: {
    done: string;
    handoff: string;
    stale: string;
    quota: string;
    forbidden: string;
    error: string;
  };
}

export interface OwnLeadsLabels {
  listLabel: string;
  statuses: Record<(typeof leadStatuses)[number], string>;
  vias: Record<(typeof leadVias)[number] | "none", string>;
  noContact: string;
  openContact: string;
  openContactAria: string;
  assignedTo: string;
  noEmail: string;
}
