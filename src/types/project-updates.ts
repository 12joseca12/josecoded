import { z } from "zod";

export const updateVisibilities = ["internal", "client"] as const;
export type UpdateVisibility = (typeof updateVisibilities)[number];

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

export const taskOptionSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  assigned_to_me: z.boolean(),
});
export type TaskOption = z.infer<typeof taskOptionSchema>;

export const updateInputSchema = z.strictObject({
  projectId: z.uuid(),
  body: z.string().trim().min(1).max(updateBodyMax),
  taskId: z.union([z.uuid(), z.literal("")]).transform((value) => value || null),
  visibility: z.enum(updateVisibilities),
});
export type UpdateInput = z.input<typeof updateInputSchema>;

export const updateErrorCodes = [
  "not_project_team",
  "project_archived",
  "task_project_mismatch",
  "update_not_found",
  "forbidden",
  "error",
] as const;
export type UpdateErrorCode = (typeof updateErrorCodes)[number];

export type UpdateResult =
  | { status: "done" }
  | { status: "invalid"; field: "body" | "taskId" }
  | { status: "error"; code: UpdateErrorCode };

export type UpdateFormHandler = (raw: UpdateInput) => Promise<UpdateResult>;
export type UpdateVisibilityHandler = (
  id: string,
  visibility: UpdateVisibility,
) => Promise<UpdateResult>;
export type UpdateDeleteHandler = (id: string) => Promise<UpdateResult>;

export interface UpdateFormLabels {
  open: string;
  title: string;
  close: string;
  body: string;
  bodyHint: string;
  task: string;
  noTask: string;
  visible: string;
  visibleHint: string;
  submit: string;
  submitting: string;
  errors: Record<"body" | "taskId" | UpdateErrorCode, string>;
}

export interface ProgressLogLabels {
  title: string;
  empty: string;
  list: string;
  authors: { me: string; jose: string };
  task: string;
  visibility: Record<UpdateVisibility, string>;
  toggle: string;
  toggling: string;
  delete: string;
  deleteFor: string;
  deleteConfirm: string;
  deleting: string;
  cancel: string;
  deleted: string;
  errors: Record<UpdateErrorCode, string>;
}
