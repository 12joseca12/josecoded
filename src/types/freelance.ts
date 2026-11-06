import { z } from "zod";

import { projectPhases, projectStatuses } from "@/types/area";

export const freelanceProjectSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  brief: z.string().nullable(),
  phase: z.enum(projectPhases),
  status: z.enum(projectStatuses),
  started_at: z.string().nullable(),
  due_at: z.string().nullable(),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  done: z.number().int().min(0),
  total: z.number().int().min(0),
  percent: z.number().int().min(0).max(100),
});
export type FreelanceProject = z.infer<typeof freelanceProjectSchema>;

export const freelanceProjectsSchema = z.array(freelanceProjectSchema);

export function isOpenProject(project: FreelanceProject): boolean {
  return project.archived_at === null && project.status !== "closed";
}
