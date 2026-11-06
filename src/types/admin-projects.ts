import "@/lib/security/zod-jitless";

import { z } from "zod";

export const projectPhases = ["discover", "design", "build", "publish", "maintain"] as const;
export type ProjectPhase = (typeof projectPhases)[number];

export const projectStatuses = ["active", "paused", "closed"] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

export const projectFields = [
  "name",
  "dealId",
  "offerSlug",
  "freelanceId",
  "startedAt",
  "dueAt",
  "brief",
] as const;
export type ProjectField = (typeof projectFields)[number];

export const projectErrorCodes = [
  "forbidden",
  "deal_not_won",
  "deal_not_found",
  "contact_deal_mismatch",
  "offer_not_found",
  "invalid_freelance",
  "invalid_dates",
  "invalid_name",
  "project_not_found",
  "unavailable",
  "error",
] as const;
export type ProjectErrorCode = (typeof projectErrorCodes)[number];

export const projectNameMax = 200;
export const projectBriefMax = 20000;

const nullableUuid = z.union([z.uuid(), z.literal("")]).transform((value) => value || null);
const nullableDay = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
  .refine((value) => value === "" || !Number.isNaN(Date.parse(`${value}T00:00:00Z`)))
  .transform((value) => value || null);

const projectShape = {
  name: z.string().trim().min(1).max(projectNameMax),
  offerSlug: z
    .string()
    .max(60)
    .transform((value) => value || null),
  startedAt: nullableDay,
  dueAt: nullableDay,
};

function datesOrdered(value: { startedAt: string | null; dueAt: string | null }): boolean {
  return value.startedAt === null || value.dueAt === null || value.dueAt >= value.startedAt;
}

export const createProjectSchema = z
  .strictObject({
    ...projectShape,
    dealId: nullableUuid,
    freelanceId: nullableUuid,
    brief: z
      .string()
      .max(projectBriefMax)
      .transform((value) => value.trim() || null),
  })
  .refine(datesOrdered, { path: ["dueAt"] });

export const updateProjectSchema = z
  .strictObject({ id: z.uuid(), ...projectShape })
  .refine(datesOrdered, { path: ["dueAt"] });

export type ProjectActionResult =
  | { status: "done"; id: string }
  | { status: "invalid"; field: ProjectField }
  | { status: "error"; code: ProjectErrorCode };

export type ProjectHandler = (raw: unknown) => Promise<ProjectActionResult>;

export const projectRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  client_id: z.uuid().nullable(),
  client_name: z.string().nullable(),
  contact_id: z.uuid().nullable(),
  deal_id: z.uuid().nullable(),
  offer_slug: z.string().nullable(),
  phase: z.enum(projectPhases),
  status: z.enum(projectStatuses),
  freelance_id: z.uuid().nullable(),
  freelance_name: z.string().nullable(),
  started_at: z.string().nullable(),
  due_at: z.string().nullable(),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  done: z.number(),
  total: z.number(),
  percent: z.number(),
  stories_to_decide: z.number(),
});
export type ProjectRow = z.infer<typeof projectRowSchema>;

export const dealOptionSchema = z.object({
  id: z.uuid(),
  won_amount: z.number().nullable(),
  contacts: z.object({ full_name: z.string() }).nullable(),
});

export interface ProjectOptions {
  deals: { id: string; label: string }[];
  offers: { slug: string; name: string }[];
  freelances: { id: string; name: string }[];
}

export type ProjectsResult =
  { status: "ok"; rows: ProjectRow[]; options: ProjectOptions } | { status: "error" };

export interface ProjectSheetLabels {
  create: string;
  edit: string;
  editFor: string;
  createTitle: string;
  editTitle: string;
  close: string;
  name: string;
  deal: string;
  dealHint: string;
  dealNone: string;
  offer: string;
  offerNone: string;
  freelance: string;
  freelanceNone: string;
  startedAt: string;
  dueAt: string;
  brief: string;
  briefHint: string;
  optional: string;
  submitCreate: string;
  submitEdit: string;
  submitting: string;
  doneCreate: string;
  doneEdit: string;
  errors: Record<ProjectField | ProjectErrorCode, string>;
}

export interface ProjectTableLabels {
  region: string;
  caption: string;
  columns: {
    name: string;
    phase: string;
    progress: string;
    stories: string;
    freelance: string;
    dates: string;
    actions: string;
  };
  phases: Record<ProjectPhase, string>;
  statuses: Record<ProjectStatus, string>;
  noClient: string;
  none: string;
  progress: string;
  progressText: string;
  storiesToDecide: string;
}
