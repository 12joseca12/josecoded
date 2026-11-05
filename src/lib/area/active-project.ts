import { type AreaProject, projectStatuses } from "@/types/area";

export function resolveActiveProject(
  projects: readonly AreaProject[],
  requested: string | null,
  remembered: string | null,
): AreaProject | null {
  const byId = (id: string | null) =>
    id === null ? undefined : projects.find((project) => project.id === id);
  const live = projects.find((project) => project.status === projectStatuses[0]);
  return byId(requested) ?? byId(remembered) ?? live ?? projects[0] ?? null;
}

export function readParam(value: string | string[] | undefined): string | null {
  const single = Array.isArray(value) ? value[0] : value;
  return single === undefined || single === "" ? null : single;
}
