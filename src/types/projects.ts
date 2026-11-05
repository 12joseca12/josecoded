import { z } from "zod";

import type { ProjectMeta } from "@/content/schemas";

export const projectFilters = ["all", "app", "web"] as const;
export type ProjectFilter = (typeof projectFilters)[number];

export const projectFilterParam = z.enum(["apps", "webs"]);

export const caseKinds = ["challenge", "did", "result"] as const;
export type CaseKind = (typeof caseKinds)[number];

export type ProjectStatus = ProjectMeta["status"];
