import "@/lib/security/zod-jitless";

import { z } from "zod";

import { type ProjectPhase, projectPhases } from "@/types/admin-projects";

export const taskStatuses = ["todo", "doing", "done"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const taskFields = ["title", "description", "phase", "status", "assigneeId"] as const;
export type TaskField = (typeof taskFields)[number];

export const taskErrorCodes = [
  "forbidden",
  "invalid_title",
  "invalid_assignee",
  "project_not_found",
  "task_not_found",
  "task_not_deletable",
  "project_archived",
  "unavailable",
  "error",
] as const;
export type TaskErrorCode = (typeof taskErrorCodes)[number];

export const taskTitleMax = 200;
export const taskDescriptionMax = 5000;

export const taskRowSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  phase: z.enum(projectPhases),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(taskStatuses),
  assignee_id: z.uuid().nullable(),
  story_id: z.uuid().nullable(),
  sort: z.number(),
  done_at: z.string().nullable(),
});
export type TaskRow = z.infer<typeof taskRowSchema>;

export const taskInputSchema = z.strictObject({
  id: z.union([z.uuid(), z.literal("")]).transform((value) => value || null),
  projectId: z.uuid(),
  title: z.string().trim().min(1).max(taskTitleMax),
  description: z
    .string()
    .max(taskDescriptionMax)
    .transform((value) => value.trim() || null),
  phase: z.enum(projectPhases),
  status: z.enum(taskStatuses),
  assigneeId: z.union([z.uuid(), z.literal("")]).transform((value) => value || null),
  storyId: z.union([z.uuid(), z.literal("")]).transform((value) => value || null),
});

export const moveTaskSchema = z.strictObject({
  id: z.uuid(),
  phase: z.enum(projectPhases),
  sort: z.number().int().min(0).max(10000),
});

export const taskIdSchema = z.strictObject({ id: z.uuid() });
export const phaseInputSchema = z.strictObject({ id: z.uuid(), phase: z.enum(projectPhases) });
export const archiveInputSchema = z.strictObject({ id: z.uuid(), archived: z.boolean() });

export type TaskResult =
  | { status: "done" }
  | { status: "invalid"; field: TaskField }
  | { status: "error"; code: TaskErrorCode };

export type TaskHandler = (raw: unknown) => Promise<TaskResult>;

export type ProjectDetailResult =
  | { status: "ok"; brief: string | null; tasks: TaskRow[] }
  | { status: "missing" }
  | { status: "error" };

export interface Assignee {
  id: string;
  name: string;
}

export interface TaskSheetLabels {
  create: string;
  createTitle: string;
  editTitle: string;
  edit: string;
  editFor: string;
  close: string;
  title: string;
  description: string;
  optional: string;
  phase: string;
  status: string;
  assignee: string;
  assigneeNone: string;
  submitCreate: string;
  submitEdit: string;
  submitting: string;
  done: string;
  delete: string;
  deleteConfirm: string;
  deleting: string;
  cancel: string;
  statuses: Record<TaskStatus, string>;
  phases: Record<ProjectPhase, string>;
  errors: Record<TaskField | TaskErrorCode, string>;
}

export interface PhaseBoardLabels {
  region: string;
  empty: string;
  assignedTo: string;
  unassigned: string;
  moveTo: string;
  moveToFor: string;
  up: string;
  down: string;
  moving: string;
  moved: string;
  statuses: Record<TaskStatus, string>;
  phases: Record<ProjectPhase, string>;
  errors: Record<TaskErrorCode, string>;
}

export interface ProjectHeadLabels {
  phase: string;
  phaseSaved: string;
  statuses: Record<"active" | "paused" | "closed", string>;
  archive: string;
  archiveConfirm: string;
  restore: string;
  working: string;
  cancel: string;
  archived: string;
  restored: string;
  progress: string;
  progressText: string;
  phases: Record<ProjectPhase, string>;
  errors: Record<TaskErrorCode, string>;
}
