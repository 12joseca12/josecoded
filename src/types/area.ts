import { z } from "zod";

export const projectPhases = ["discover", "design", "build", "publish", "maintain"] as const;
export type ProjectPhase = (typeof projectPhases)[number];

export const projectStatuses = ["active", "paused", "closed"] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

export const areaProjectSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  phase: z.enum(projectPhases),
  status: z.enum(projectStatuses),
  created_at: z.string(),
});
export type AreaProject = z.infer<typeof areaProjectSchema>;

export const areaProjectsSchema = z.array(areaProjectSchema);

export const activeProjectParam = "proyecto";
export const activeProjectCookie = "jc_project";
export const activeProjectCookieMaxAge = 60 * 60 * 24 * 365;
