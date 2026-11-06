import "server-only";

import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { activeProjectCookie, activeProjectParam, type AreaProject } from "@/types/area";

import { readParam, resolveActiveProject } from "./active-project";
import { fetchAreaProjects } from "./projects";

type SearchParams = Record<string, string | string[] | undefined>;

export type ActiveProjectResult =
  { status: "ok"; projects: AreaProject[]; active: AreaProject | null } | { status: "error" };

export async function loadActiveProject(params: SearchParams): Promise<ActiveProjectResult> {
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error" };
  const result = await fetchAreaProjects(client);
  if (result.status === "error") return result;
  const remembered = (await cookies()).get(activeProjectCookie)?.value ?? null;
  const active = resolveActiveProject(
    result.projects,
    readParam(params[activeProjectParam]),
    remembered,
  );
  return { status: "ok", projects: result.projects, active };
}
