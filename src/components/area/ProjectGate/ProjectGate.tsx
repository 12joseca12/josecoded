import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { loadActiveProject } from "@/lib/area/load-active-project";
import type { AreaProject } from "@/types/area";

import { ActiveProjectCookie } from "../ActiveProjectCookie/ActiveProjectCookie";
import { ProjectSwitcher } from "../ProjectSwitcher/ProjectSwitcher";

type SearchParams = Record<string, string | string[] | undefined>;

interface ProjectGateProps {
  locale: Locale;
  params: SearchParams;
  path: string;
  children: (project: AreaProject) => ReactNode;
}

export async function ProjectGate({ locale, params, path, children }: ProjectGateProps) {
  const t = await getTranslator(locale);
  const result = await loadActiveProject(params);
  if (result.status === "error") throw new Error("area_projects_unreadable");
  const { active, projects } = result;
  if (active === null) {
    return (
      <EmptyState headingLevel={1} title={t("area.empty.title")} text={t("area.empty.text")} />
    );
  }
  return (
    <>
      <ActiveProjectCookie projectId={active.id} />
      <ProjectSwitcher
        projects={projects}
        activeId={active.id}
        path={`/${locale}/area${path}`}
        label={t("area.home.switcher.label")}
      />
      {children(active)}
    </>
  );
}
