import "@/lib/security/zod-jitless";

import { z } from "zod";

export const storyStatuses = ["proposed", "in_review", "accepted", "rejected", "in_tasks"] as const;
export type StoryStatus = (typeof storyStatuses)[number];

export const storyDecisions = ["accept", "reject", "out_of_scope"] as const;
export type StoryDecision = (typeof storyDecisions)[number];

export const decisionFields = ["decision", "hours", "amount", "note"] as const;
export type DecisionField = (typeof decisionFields)[number];

export const decisionErrorCodes = [
  "forbidden",
  "invalid_decision",
  "story_not_found",
  "story_not_proposed",
  "note_required",
  "estimate_required",
  "unavailable",
  "error",
] as const;
export type DecisionErrorCode = (typeof decisionErrorCodes)[number];

export const decisionNoteMax = 2000;

export const storyRowSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  author_id: z.uuid().nullable(),
  title: z.string(),
  as_a: z.string(),
  i_want: z.string(),
  so_that: z.string(),
  criteria: z.array(z.string()),
  status: z.enum(storyStatuses),
  out_of_scope: z.boolean(),
  estimate_hours: z.number().nullable(),
  estimate_amount: z.number().nullable(),
  decision_note: z.string().nullable(),
  decided_at: z.string().nullable(),
  confirmed_at: z.string().nullable(),
  task_id: z.uuid().nullable(),
  created_at: z.string(),
});
export type StoryRow = z.infer<typeof storyRowSchema>;

function parseNumber(value: string): number | null {
  const text = value.trim().replace(",", ".");
  if (text === "") return null;
  return /^\d{1,7}(\.\d{1,2})?$/.test(text) ? Number(text) : Number.NaN;
}

const optionalNumber = z
  .string()
  .max(12)
  .transform(parseNumber)
  .pipe(z.number().min(0).max(9999999).nullable());

export const decideInputSchema = z
  .strictObject({
    id: z.uuid(),
    decision: z.enum(storyDecisions),
    hours: optionalNumber,
    amount: optionalNumber,
    note: z
      .string()
      .max(decisionNoteMax)
      .transform((value) => value.trim() || null),
    createTask: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.decision === "reject" && value.note === null) {
      context.addIssue({ code: "custom", path: ["note"], message: "note_required" });
    }
    if (value.decision === "out_of_scope") {
      if (value.hours === null || value.hours <= 0) {
        context.addIssue({ code: "custom", path: ["hours"], message: "estimate_required" });
      }
      if (value.amount === null || value.amount <= 0) {
        context.addIssue({ code: "custom", path: ["amount"], message: "estimate_required" });
      }
    }
  });

export type DecideResult =
  | { status: "done"; next: StoryStatus }
  | { status: "invalid"; field: DecisionField }
  | { status: "error"; code: DecisionErrorCode };

export type DecideHandler = (raw: unknown) => Promise<DecideResult>;

export type StoriesResult = { status: "ok"; stories: StoryRow[] } | { status: "error" };

export interface StoryListLabels {
  empty: { title: string; text: string };
  groups: { proposed: string; in_review: string; decided: string };
  asA: string;
  iWant: string;
  soThat: string;
  criteria: string;
  statuses: Record<StoryStatus, string>;
  outOfScope: string;
  estimate: string;
  note: string;
  decidedOn: string;
  confirmedOn: string;
  awaiting: string;
  hasTask: string;
}

export interface StoryDecisionLabels {
  open: string;
  openFor: string;
  title: string;
  close: string;
  decision: string;
  decisions: Record<StoryDecision, string>;
  hours: string;
  amount: string;
  amountHint: string;
  note: string;
  noteHint: string;
  optional: string;
  createTask: string;
  submit: string;
  submitting: string;
  done: Record<StoryStatus, string>;
  errors: Record<DecisionField | DecisionErrorCode, string>;
}
