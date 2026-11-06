export type ProjectTabId = "tasks" | "stories" | "documents" | "team" | "updates";

export interface ProjectTab {
  id: ProjectTabId;
  param: string;
}

export const projectTabs: readonly ProjectTab[] = [
  { id: "tasks", param: "tareas" },
  { id: "stories", param: "historias" },
  { id: "documents", param: "documentos" },
  { id: "team", param: "equipo" },
  { id: "updates", param: "avances" },
];

export function tabFromParam(value: string | undefined): ProjectTabId {
  return projectTabs.find((tab) => tab.param === value)?.id ?? "tasks";
}
