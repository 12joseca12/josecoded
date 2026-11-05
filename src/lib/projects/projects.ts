import type { ProjectMeta } from "@/content/schemas";
import { type ProjectFilter, projectFilterParam } from "@/types/projects";

interface Listed {
  slug: string;
  meta: ProjectMeta;
}

const filterByParam: Record<"apps" | "webs", ProjectFilter> = { apps: "app", webs: "web" };
const paramByFilter: Record<ProjectFilter, string | null> = {
  all: null,
  app: "apps",
  web: "webs",
};

export function parseProjectFilter(value: string | string[] | undefined): ProjectFilter {
  const parsed = projectFilterParam.safeParse(Array.isArray(value) ? value[0] : value);
  return parsed.success ? filterByParam[parsed.data] : "all";
}

export function filterProjects<T extends Listed>(
  entries: readonly T[],
  filter: ProjectFilter,
): T[] {
  return filter === "all" ? [...entries] : entries.filter((entry) => entry.meta.kind === filter);
}

export function filtersAvailable(entries: readonly Listed[]): boolean {
  const apps = filterProjects(entries, "app").length;
  const webs = filterProjects(entries, "web").length;
  return apps >= 2 && webs >= 2;
}

export function projectsPath(filter: ProjectFilter): string {
  const param = paramByFilter[filter];
  return param ? `/proyectos?tipo=${param}` : "/proyectos";
}

export function neighbours<T extends Listed>(
  entries: readonly T[],
  slug: string,
): { prev: T | null; next: T | null } {
  const index = entries.findIndex((entry) => entry.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return { prev: entries[index - 1] ?? null, next: entries[index + 1] ?? null };
}

const viaByService: Record<ProjectMeta["relatedService"], string> = {
  freelance: "freelance",
  "a-medida": "project",
};

export function serviceHref(locale: string, service: ProjectMeta["relatedService"]): string {
  return `/${locale}/servicios/${service}`;
}

export function projectContactHref(
  locale: string,
  service: ProjectMeta["relatedService"],
  slug: string,
): string {
  const params = new URLSearchParams({ via: viaByService[service], from: slug });
  return `/${locale}/contacto?${params.toString()}#formulario`;
}
