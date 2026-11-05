export type ProjectTabId = "tasks";

export interface ProjectTab {
  id: ProjectTabId;
  param: string;
}

export const projectTabs: readonly ProjectTab[] = [{ id: "tasks", param: "tareas" }];

export function tabFromParam(value: string | undefined): ProjectTabId {
  return projectTabs.find((tab) => tab.param === value)?.id ?? "tasks";
}
