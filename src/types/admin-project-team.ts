import "@/lib/security/zod-jitless";

import { z } from "zod";

export const linkFields = ["name", "url", "usage"] as const;
export type LinkField = (typeof linkFields)[number];

export const linkErrorCodes = [
  "forbidden",
  "duplicate_url",
  "invalid_url",
  "link_not_found",
  "project_not_found",
  "ids_mismatch",
  "unavailable",
  "error",
] as const;
export type LinkErrorCode = (typeof linkErrorCodes)[number];

export const linkNameMax = 80;
export const linkUrlMax = 2048;
export const linkUsageMax = 280;
export const linksMax = 12;

const httpsUrl = /^https:\/\/[^\s/$.?#].[^\s]*$/;

function isHttpsUrl(value: string): boolean {
  if (!httpsUrl.test(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const linkShape = {
  name: z.string().trim().min(1).max(linkNameMax),
  url: z.string().trim().max(linkUrlMax).refine(isHttpsUrl),
  usage: z
    .string()
    .max(linkUsageMax)
    .transform((value) => value.trim() || null),
};

export const projectLinkSchema = z.strictObject(linkShape);
export const addLinkSchema = z.strictObject({ projectId: z.uuid(), ...linkShape });
export const updateLinkSchema = z.strictObject({ id: z.uuid(), ...linkShape });
export const deleteLinkSchema = z.strictObject({ id: z.uuid() });
export const reorderLinksSchema = z.strictObject({
  projectId: z.uuid(),
  ids: z.array(z.uuid()).min(1).max(100),
});

export const linkRowSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  name: z.string(),
  url: z.string(),
  usage: z.string().nullable(),
  sort: z.number(),
});
export type LinkRow = z.infer<typeof linkRowSchema>;

export type LinkResult =
  | { status: "done" }
  | { status: "invalid"; field: LinkField }
  | { status: "error"; code: LinkErrorCode };

export type LinkHandler = (raw: unknown) => Promise<LinkResult>;

export type LinksResult = { status: "ok"; links: LinkRow[] } | { status: "error" };

export const teamErrorCodes = [
  "forbidden",
  "invalid_client",
  "invalid_freelance",
  "project_not_found",
  "project_archived",
  "unavailable",
  "error",
] as const;
export type TeamErrorCode = (typeof teamErrorCodes)[number];

export const setClientSchema = z.strictObject({ projectId: z.uuid(), userId: z.uuid() });
export const setFreelanceSchema = z.strictObject({
  projectId: z.uuid(),
  userId: z.union([z.uuid(), z.literal("")]).transform((value) => value || null),
});

export type TeamResult =
  { status: "done" } | { status: "invalid" } | { status: "error"; code: TeamErrorCode };

export type TeamHandler = (raw: unknown) => Promise<TeamResult>;

export const personSchema = z.object({
  id: z.uuid(),
  full_name: z.string(),
  role: z.enum(["client", "freelance"]),
});

export type TeamPeopleResult =
  | {
      status: "ok";
      clients: { id: string; name: string }[];
      freelances: { id: string; name: string }[];
    }
  | { status: "error" };

export interface LinkEditorLabels {
  region: string;
  title: string;
  intro: string;
  empty: string;
  add: string;
  edit: string;
  editFor: string;
  cancel: string;
  delete: string;
  deleteFor: string;
  deleteConfirm: string;
  deleting: string;
  up: string;
  down: string;
  moved: string;
  deleted: string;
  saved: string;
  limit: string;
  openNewTab: string;
  form: {
    name: string;
    url: string;
    urlHint: string;
    usage: string;
    usageHint: string;
    optional: string;
    submitAdd: string;
    submitEdit: string;
    submitting: string;
  };
  errors: Record<LinkField | LinkErrorCode, string>;
}

export interface TeamPanelLabels {
  title: string;
  client: {
    title: string;
    none: string;
    noneHelp: string;
    assign: string;
    assignPlaceholder: string;
    assignSubmit: string;
    assigning: string;
    assigned: string;
    noCandidates: string;
  };
  freelance: {
    title: string;
    none: string;
    field: string;
    submit: string;
    submitting: string;
    saved: string;
  };
  errors: Record<TeamErrorCode, string>;
}
