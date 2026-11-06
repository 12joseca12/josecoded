import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  decideInputSchema,
  type DecideResult,
  type DecisionErrorCode,
  decisionErrorCodes,
  type DecisionField,
  decisionFields,
  type StoriesResult,
  storyRowSchema,
  storyStatuses,
} from "@/types/admin-project-stories";
import type { Database } from "@/types/database";

export interface RpcFailure {
  code?: string | null;
  message?: string | null;
}

const knownCodes = new Set<string>(decisionErrorCodes);

export function mapDecisionError(error: RpcFailure): DecisionErrorCode {
  const message = error.message ?? "";
  if (knownCodes.has(message)) return message as DecisionErrorCode;
  if (error.code === "42501") return "forbidden";
  return "error";
}

function firstField(issues: readonly { path: PropertyKey[] }[]): DecisionField {
  const key = issues[0]?.path[0];
  return decisionFields.find((field) => field === key) ?? "decision";
}

const storiesSchema = z.array(storyRowSchema);
const nextSchema = z.enum(storyStatuses);

const columns =
  "id, project_id, author_id, title, as_a, i_want, so_that, criteria, status, out_of_scope, estimate_hours, estimate_amount, decision_note, decided_at, confirmed_at, task_id, created_at";

export async function fetchProjectStories(
  client: SupabaseClient<Database>,
  projectId: string,
): Promise<StoriesResult> {
  try {
    const { data, error } = await client
      .from("stories")
      .select(columns)
      .eq("project_id", projectId)
      .order("created_at");
    if (error) return { status: "error" };
    const parsed = storiesSchema.safeParse(data);
    return parsed.success ? { status: "ok", stories: parsed.data } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

export async function runDecideStory(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<DecideResult> {
  const parsed = decideInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: firstField(parsed.error.issues) };
  const input = parsed.data;
  try {
    const { data, error } = await client.rpc("decide_story", {
      p_id: input.id,
      p_decision: input.decision,
      p_hours: input.hours ?? undefined,
      p_amount: input.amount ?? undefined,
      p_note: input.note ?? undefined,
      p_create_task: input.decision === "accept" && input.createTask,
    });
    if (error) return { status: "error", code: mapDecisionError(error) };
    const next = nextSchema.safeParse(data);
    return next.success ? { status: "done", next: next.data } : { status: "error", code: "error" };
  } catch {
    return { status: "error", code: "error" };
  }
}
