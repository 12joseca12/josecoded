import type { ServerSupabase } from "@/lib/supabase/server";
import { type AreaProject, areaProjectsSchema } from "@/types/area";

const projectColumns = "id, name, phase, status, offer_slug, due_at, created_at";

export type AreaProjectsResult = { status: "ok"; projects: AreaProject[] } | { status: "error" };

export async function fetchAreaProjects(client: ServerSupabase): Promise<AreaProjectsResult> {
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
