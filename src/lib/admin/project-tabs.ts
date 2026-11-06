export type ProjectTabId = "tasks" | "stories" | "documents";

export interface ProjectTab {
  id: ProjectTabId;
  param: string;
}

export const projectTabs: readonly ProjectTab[] = [
  { id: "tasks", param: "tareas" },
  { id: "stories", param: "historias" },
  { id: "documents", param: "documentos" },
];

export function tabFromParam(value: string | undefined): ProjectTabId {
  return projectTabs.find((tab) => tab.param === value)?.id ?? "tasks";
}
