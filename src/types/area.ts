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

export type UpdateKind = "task" | "story" | "document" | "update" | "fee";

export const updateAuthors = ["jose", "team"] as const;
export type UpdateAuthor = (typeof updateAuthors)[number];

export const clientUpdateSchema = z.object({
  id: z.uuid(),
  body: z.string(),
  created_at: z.string(),
  author_label: z.enum(updateAuthors),
});

export interface RecentUpdate {
  key: string;
  kind: UpdateKind;
  title: string;
  status: StoryStatus | null;
  author: UpdateAuthor | null;
  at: string;
}

export type TodoActionResult =
  { status: "done" } | { status: "stale" } | { status: "forbidden" } | { status: "error" };

export type TodoHandler = (id: string, accept?: boolean) => Promise<TodoActionResult>;

export const assigneeKinds = ["none", "me", "client", "team"] as const;
export type AssigneeKind = (typeof assigneeKinds)[number];

export const taskViewSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  phase: z.enum(projectPhases),
  status: z.enum(taskStatuses),
  assigned_to_me: z.boolean(),
  assignee_kind: z.enum(assigneeKinds),
  story_id: z.uuid().nullable(),
});

export const boardTaskSchema = taskViewSchema.omit({ story_id: true }).extend({
  story: z.object({ id: z.uuid(), title: z.string() }).nullable(),
});
export type BoardTask = z.infer<typeof boardTaskSchema>;

export const taskDetailSchema = boardTaskSchema.extend({
  description: z.string().nullable(),
  done_at: z.string().nullable(),
});
export type TaskDetailRow = z.infer<typeof taskDetailSchema>;

export const storyCriteriaMax = 12;
export const storyFields = ["title", "asA", "iWant", "soThat", "criteria"] as const;
export type StoryField = (typeof storyFields)[number];

const storyText = (limit: number) => z.string().trim().min(1).max(limit);

export const storyInputSchema = z.strictObject({
  title: storyText(200),
  asA: storyText(500),
  iWant: storyText(500),
  soThat: storyText(500),
  criteria: z
    .array(z.string())
    .transform((list) => list.map((entry) => entry.trim()).filter((entry) => entry !== ""))
    .pipe(
      z
        .array(z.string().max(500))
        .max(storyCriteriaMax)
        .refine((list) => list.join("").length <= 6000),
    ),
});
export type StoryInput = z.infer<typeof storyInputSchema>;
export type StoryDraft = z.input<typeof storyInputSchema>;

export type StoryActionResult =
  | { status: "done"; id: string }
  | { status: "invalid"; field: StoryField }
  | { status: "stale" }
  | { status: "forbidden" }
  | { status: "error" };

export interface StoryDeleteResult {
  status: "done" | "stale" | "forbidden" | "error";
}

export const storyListSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  status: z.enum(storyStatuses),
  estimate_hours: z.number().nullable(),
  estimate_amount: z.number().nullable(),
  created_at: z.string(),
});
export type StoryListRow = z.infer<typeof storyListSchema>;

export const storyDetailSchema = storyListSchema.extend({
  as_a: z.string(),
  i_want: z.string(),
  so_that: z.string(),
  criteria: z.array(z.string()),
  decision_note: z.string().nullable(),
  decided_at: z.string().nullable(),
  task_id: z.uuid().nullable(),
  author_id: z.uuid().nullable(),
});
export type StoryDetailRow = z.infer<typeof storyDetailSchema>;
