import type { SupabaseClient } from "@supabase/supabase-js";

import { type AreaProject, areaProjectsSchema } from "@/types/area";

const projectColumns = "id, name, phase, status, created_at";

export type AreaProjectsResult = { status: "ok"; projects: AreaProject[] } | { status: "error" };

export async function fetchAreaProjects(client: SupabaseClient): Promise<AreaProjectsResult> {
  const { data, error } = await client
    .from("projects")
    .select(projectColumns)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  if (error) return { status: "error" };
  const parsed = areaProjectsSchema.safeParse(data);
  if (!parsed.success) return { status: "error" };
  return { status: "ok", projects: parsed.data };
}
