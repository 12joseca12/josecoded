import { z } from "zod";

import type { ServerSupabase } from "@/lib/supabase/server";
import {
  clientUpdateSchema,
  decidedStorySchema,
  doneTaskSchema,
  type MyTask,
  myTaskSchema,
  newDocumentSchema,
  progressRowSchema,
  type ProjectLink,
  projectLinkSchema,
  type ProjectProgress,
  type RecentUpdate,
  type ReviewStory,
  reviewStorySchema,
  type UpdateAuthor,
} from "@/types/area";

export const recentLimit = 6;

export type Fetched<T> = { status: "ok"; data: T } | { status: "error" };

function parseRows<S extends z.ZodType>(
  schema: S,
  result: { data: unknown; error: unknown },
): Fetched<z.infer<S>[]> {
  if (result.error) return { status: "error" };
  const parsed = z.array(schema).safeParse(result.data);
  if (!parsed.success) return { status: "error" };
  return { status: "ok", data: parsed.data };
}

export async function fetchProgress(
  client: ServerSupabase,
  projectId: string,
): Promise<Fetched<ProjectProgress>> {
  const rows = parseRows(
    progressRowSchema,
    await client
      .from("project_progress")
      .select("done, total, percent")
      .eq("project_id", projectId)
      .limit(1),
  );
  if (rows.status === "error") return rows;
  return { status: "ok", data: rows.data[0] ?? { done: 0, total: 0, percent: 0 } };
}

export interface Todo {
  tasks: MyTask[];
  stories: ReviewStory[];
}

export async function fetchTodo(
  client: ServerSupabase,
  projectId: string,
  userId: string,
): Promise<Fetched<Todo>> {
  const [tasks, stories] = await Promise.all([
    client
      .from("project_tasks")
      .select("id, title, phase, status")
      .eq("project_id", projectId)
      .eq("assigned_to_me", true)
      .neq("status", "done")
      .order("phase")
      .order("sort"),
    client
      .from("stories")
      .select("id, title, estimate_hours, estimate_amount, decision_note")
      .eq("project_id", projectId)
      .eq("author_id", userId)
      .eq("status", "in_review")
      .order("decided_at", { ascending: false }),
  ]);
  const parsedTasks = parseRows(myTaskSchema, tasks);
  const parsedStories = parseRows(reviewStorySchema, stories);
  if (parsedTasks.status === "error" || parsedStories.status === "error") {
    return { status: "error" };
  }
  return { status: "ok", data: { tasks: parsedTasks.data, stories: parsedStories.data } };
}

export async function fetchLinks(
  client: ServerSupabase,
  projectId: string,
): Promise<Fetched<ProjectLink[]>> {
  return parseRows(
    projectLinkSchema,
    await client
      .from("project_links")
      .select("id, name, url, usage")
      .eq("project_id", projectId)
      .order("sort")
      .order("created_at"),
  );
}

export function linkDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function buildRecentUpdates(
  tasks: readonly { id: string; title: string; done_at: string }[],
  stories: readonly {
    id: string;
    title: string;
    status: RecentUpdate["status"];
    decided_at: string;
  }[],
  documents: readonly { id: string; name: string; created_at: string }[],
  updates: readonly {
    id: string;
    body: string;
    created_at: string;
    author_label: UpdateAuthor;
  }[] = [],
  limit = recentLimit,
): RecentUpdate[] {
  const entries: RecentUpdate[] = [
    ...tasks.map((task) => ({
      key: `task-${task.id}`,
      kind: "task" as const,
      title: task.title,
      status: null,
      author: null,
      at: task.done_at,
    })),
    ...updates.map((update) => ({
      key: `update-${update.id}`,
      kind: "update" as const,
      title: update.body,
      status: null,
      author: update.author_label,
      at: update.created_at,
    })),
    ...stories.map((story) => ({
      key: `story-${story.id}`,
      kind: "story" as const,
      title: story.title,
      status: story.status,
      author: null,
      at: story.decided_at,
    })),
    ...documents.map((document) => ({
      key: `document-${document.id}`,
      kind: "document" as const,
      title: document.name,
      status: null,
      author: null,
      at: document.created_at,
    })),
  ];
  return entries.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export async function fetchRecentUpdates(
  client: ServerSupabase,
  projectId: string,
): Promise<Fetched<RecentUpdate[]>> {
  const [tasks, stories, documents, updates] = await Promise.all([
    client
      .from("project_tasks")
      .select("id, title, done_at")
      .eq("project_id", projectId)
      .eq("status", "done")
      .not("done_at", "is", null)
      .order("done_at", { ascending: false })
      .limit(recentLimit),
    client
      .from("stories")
      .select("id, title, status, decided_at")
      .eq("project_id", projectId)
      .not("decided_at", "is", null)
      .order("decided_at", { ascending: false })
      .limit(recentLimit),
    client
      .from("project_documents")
      .select("id, name, created_at")
      .eq("project_id", projectId)
      .eq("visibility", "client")
      .order("created_at", { ascending: false })
      .limit(recentLimit),
    client
      .from("client_project_updates")
      .select("id, body, created_at, author_label")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(recentLimit),
  ]);
  const parsedTasks = parseRows(doneTaskSchema, tasks);
  const parsedStories = parseRows(decidedStorySchema, stories);
  const parsedDocuments = parseRows(newDocumentSchema, documents);
  const parsedUpdates = parseRows(clientUpdateSchema, updates);
  if (
    parsedTasks.status === "error" ||
    parsedStories.status === "error" ||
    parsedDocuments.status === "error" ||
    parsedUpdates.status === "error"
  ) {
    return { status: "error" };
  }
  return {
    status: "ok",
    data: buildRecentUpdates(
      parsedTasks.data,
      parsedStories.data,
      parsedDocuments.data,
      parsedUpdates.data,
    ),
  };
}
