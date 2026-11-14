import { projectMetas } from "./projects-meta.generated";

const byOrder = (a: { meta: { order: number } }, b: { meta: { order: number } }) =>
  a.meta.order - b.meta.order;

export const listProjectMetas = () => [...projectMetas].sort(byOrder);
export const getProjectMeta = (slug: string) => projectMetas.find((entry) => entry.slug === slug);
export const hasPublishedProjects = () =>
  listProjectMetas().some((entry) => !JSON.stringify(entry.meta).includes("{{DATO"));
