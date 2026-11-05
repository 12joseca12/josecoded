import { z } from "zod";

export const projectPhases = ["discover", "design", "build", "publish", "maintain"] as const;
export type ProjectPhase = (typeof projectPhases)[number];

export const projectStatuses = ["active", "paused", "closed"] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

export const areaProjectSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  phase: z.enum(projectPhases),
  status: z.enum(projectStatuses),
  offer_slug: z.string().nullable(),
  due_at: z.string().nullable(),
  created_at: z.string(),
});
export type AreaProject = z.infer<typeof areaProjectSchema>;

export const areaProjectsSchema = z.array(areaProjectSchema);

export const activeProjectParam = "proyecto";
export const activeProjectCookie = "jc_project";
export const activeProjectCookieMaxAge = 60 * 60 * 24 * 365;

export const progressRowSchema = z.object({
  done: z.number().int().min(0),
  total: z.number().int().min(0),
  percent: z.number().int().min(0).max(100),
});
export type ProjectProgress = z.infer<typeof progressRowSchema>;

export const taskStatuses = ["todo", "doing", "done"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const storyStatuses = ["proposed", "in_review", "accepted", "rejected", "in_tasks"] as const;
export type StoryStatus = (typeof storyStatuses)[number];

export const myTaskSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  phase: z.enum(projectPhases),
  status: z.enum(taskStatuses),
});
export type MyTask = z.infer<typeof myTaskSchema>;

export const reviewStorySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  estimate_hours: z.number().nullable(),
  estimate_amount: z.number().nullable(),
  decision_note: z.string().nullable(),
});
export type ReviewStory = z.infer<typeof reviewStorySchema>;

export const projectLinkSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  url: z.url({ protocol: /^https$/ }),
  usage: z.string().nullable(),
});
export type ProjectLink = z.infer<typeof projectLinkSchema>;

export const doneTaskSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  done_at: z.string(),
});

export const decidedStorySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  status: z.enum(storyStatuses),
  decided_at: z.string(),
});

export const newDocumentSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  created_at: z.string(),
});

export type UpdateKind = "task" | "story" | "document";

export interface RecentUpdate {
  key: string;
  kind: UpdateKind;
  title: string;
  status: StoryStatus | null;
  at: string;
}

export type TodoActionResult =
  { status: "done" } | { status: "stale" } | { status: "forbidden" } | { status: "error" };

export type TodoHandler = (id: string, accept?: boolean) => Promise<TodoActionResult>;

export const boardTaskSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  phase: z.enum(projectPhases),
  status: z.enum(taskStatuses),
  assignee_id: z.uuid().nullable(),
  story: z.object({ id: z.uuid(), title: z.string() }).nullable(),
});
export type BoardTask = z.infer<typeof boardTaskSchema>;

export const taskDetailSchema = boardTaskSchema.extend({
  description: z.string().nullable(),
  done_at: z.string().nullable(),
});
export type TaskDetailRow = z.infer<typeof taskDetailSchema>;
