import type { ServerSupabase } from "@/lib/supabase/server";
import { type FreelanceProject, freelanceProjectsSchema, isOpenProject } from "@/types/freelance";

const projectColumns =
  "id, name, brief, phase, status, started_at, due_at, archived_at, created_at, done, total, percent";

export type FreelanceProjectsResult =
  { status: "ok"; open: FreelanceProject[]; closed: FreelanceProject[] } | { status: "error" };

export function splitProjects(projects: FreelanceProject[]): {
  open: FreelanceProject[];
  closed: FreelanceProject[];
} {
  return {
    open: projects.filter(isOpenProject),
    closed: projects.filter((project) => !isOpenProject(project)),
  };
}

export async function fetchFreelanceProjects(
  client: ServerSupabase,
): Promise<FreelanceProjectsResult> {
  const { data, error } = await client
    .from("freelance_projects")
    .select(projectColumns)
    .order("created_at", { ascending: false });
  if (error) return { status: "error" };
  const parsed = freelanceProjectsSchema.safeParse(data);
  if (!parsed.success) return { status: "error" };
  return { status: "ok", ...splitProjects(parsed.data) };
}
