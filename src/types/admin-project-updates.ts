import "@/lib/security/zod-jitless";

import { z } from "zod";

export const updateVisibilities = ["internal", "client"] as const;
export type UpdateVisibility = (typeof updateVisibilities)[number];

export const updateFields = ["body", "taskId"] as const;
export type UpdateField = (typeof updateFields)[number];

export const updateErrorCodes = [
  "forbidden",
  "not_project_team",
  "project_archived",
  "project_not_found",
  "task_project_mismatch",
  "update_not_found",
  "unavailable",
  "error",
] as const;
export type UpdateErrorCode = (typeof updateErrorCodes)[number];

export const updateBodyMax = 2000;

export const updateRowSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  author_id: z.uuid().nullable(),
  task_id: z.uuid().nullable(),
  body: z.string(),
  visibility: z.enum(updateVisibilities),
  created_at: z.string(),
});
export type UpdateRow = z.infer<typeof updateRowSchema>;

export type UpdatesResult =
  { status: "ok"; updates: UpdateRow[]; unreadIds: string[] } | { status: "error" };

export const createUpdateSchema = z.strictObject({
  projectId: z.uuid(),
  body: z.string().trim().min(1).max(updateBodyMax),
  taskId: z.union([z.uuid(), z.literal("")]).transform((value) => value || null),
  visibility: z.enum(updateVisibilities),
});

export const setVisibilitySchema = z.strictObject({
  id: z.uuid(),
  visibility: z.enum(updateVisibilities),
});

export const deleteUpdateSchema = z.strictObject({ id: z.uuid() });

export type UpdateActionResult =
  | { status: "done" }
  | { status: "invalid"; field: UpdateField }
  | { status: "error"; code: UpdateErrorCode };

export type UpdateHandler = (raw: unknown) => Promise<UpdateActionResult>;

export interface UpdateFormLabels {
  title: string;
  body: string;
  task: string;
  taskNone: string;
  visible: string;
  visibleHint: string;
  optional: string;
  submit: string;
  submitting: string;
  done: string;
  errors: Record<UpdateField | UpdateErrorCode, string>;
}

export interface UpdatesPanelLabels {
  title: string;
  empty: string;
  authorJose: string;
  authorFreelance: string;
  task: string;
  visibility: Record<UpdateVisibility, string>;
  publish: string;
  publishing: string;
  hide: string;
  hiding: string;
  published: string;
  hidden: string;
  delete: string;
  deleteFor: string;
  deleteTitle: string;
  deleteText: string;
  deleteSubmit: string;
  deleting: string;
  deleted: string;
  close: string;
  form: UpdateFormLabels;
  errors: Record<UpdateErrorCode, string>;
}
