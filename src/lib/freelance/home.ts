import { z } from "zod";

import { buildRecentUpdates, recentLimit } from "@/lib/area/overview";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { RecentUpdate } from "@/types/area";
import type { FreelanceProject } from "@/types/freelance";
import type { FeeItem, FeeSummary } from "@/types/freelance-fees";
import type { UpdateRow } from "@/types/project-updates";

import { type Loaded } from "./fees";

const taskSchema = z.object({ id: z.uuid(), title: z.string(), project_id: z.uuid() });
const documentSchema = z.object({ id: z.uuid(), name: z.string(), created_at: z.string() });

export interface HomeTask {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
}

export interface HomeMilestone {
  id: string;
  label: string;
  projectId: string;
  projectName: string;
}

export async function fetchMyOpenTasks(
  client: ServerSupabase,
  projects: readonly FreelanceProject[],
): Promise<Loaded<HomeTask[]>> {
  const { data, error } = await client
    .from("project_tasks")
    .select("id, title, project_id")
    .eq("assigned_to_me", true)
    .neq("status", "done")
    .order("phase")
    .order("sort");
  if (error) return { status: "error" };
  const parsed = z.array(taskSchema).safeParse(data);
  if (!parsed.success) return { status: "error" };
  const names = new Map(projects.map((project) => [project.id, project.name]));
  return {
    status: "ok",
    data: parsed.data.flatMap((task) => {
      const projectName = names.get(task.project_id);
      return projectName === undefined
        ? []
        : [{ id: task.id, title: task.title, projectId: task.project_id, projectName }];
    }),
  };
}

export function milestonesToDeliver(
  items: readonly FeeItem[],
  summaries: readonly FeeSummary[],
): HomeMilestone[] {
  const fees = new Map(summaries.map((summary) => [summary.fee_id, summary]));
  return items.flatMap((item) => {
    const fee = fees.get(item.fee_id);
    if (!fee || fee.mode === "hourly" || fee.closed_at !== null || item.status !== "pending") {
      return [];
    }
    return [
      { id: item.id, label: item.label, projectId: fee.project_id, projectName: fee.project_name },
    ];
  });
}

export async function fetchNewTeamDocuments(
  client: ServerSupabase,
): Promise<Loaded<{ id: string; name: string; created_at: string }[]>> {
  const { data, error } = await client
    .from("project_documents")
    .select("id, name, created_at")
    .eq("visibility", "team")
    .order("created_at", { ascending: false })
    .limit(recentLimit);
  if (error) return { status: "error" };
  const parsed = z.array(documentSchema).safeParse(data);
  return parsed.success ? { status: "ok", data: parsed.data } : { status: "error" };
}

export function buildHomeFeed(
  updates: readonly UpdateRow[],
  documents: readonly { id: string; name: string; created_at: string }[],
  decided: readonly { item: FeeItem; statusLabel: string }[],
  userId: string,
  limit = recentLimit,
): RecentUpdate[] {
  const base = buildRecentUpdates(
    [],
    [],
    documents,
    updates.map((update) => ({
      id: update.id,
      body: update.body,
      created_at: update.created_at,
      author_label: update.author_id === userId ? ("team" as const) : ("jose" as const),
    })),
    limit,
  );
  const fees = decided.map(({ item, statusLabel }) => ({
    key: `fee-${item.id}`,
    kind: "fee" as const,
    title: `${item.label} (${statusLabel})`,
    status: null,
    author: null,
    at: item.created_at,
  }));
  return [...base, ...fees].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
