import { getCv } from "./cv";
import { blog, legal, projects } from "./index.generated";
import type { BlogMeta, LegalMeta, ProjectMeta } from "./schemas";
import type { ContentEntry } from "./types";

const showDrafts = process.env.NODE_ENV !== "production";

const byOrder = (a: ContentEntry<ProjectMeta>, b: ContentEntry<ProjectMeta>) =>
  a.meta.order - b.meta.order;
const newestFirst = (a: ContentEntry<BlogMeta>, b: ContentEntry<BlogMeta>) =>
  b.meta.date.localeCompare(a.meta.date);

export const listProjects = () => [...projects].sort(byOrder);
export const listFeaturedProjects = () => listProjects().filter((entry) => entry.meta.featured);
export const hasPublishedProjects = () =>
  listProjects().some((entry) => !JSON.stringify(entry.meta).includes("{{DATO"));
export const getProject = (slug: string) => projects.find((entry) => entry.slug === slug);

export const listPosts = () =>
  blog.filter((entry) => showDrafts || !entry.meta.draft).sort(newestFirst);
export const getPost = (slug: string) => listPosts().find((entry) => entry.slug === slug);

export const listLegal = (): ContentEntry<LegalMeta>[] => legal;
export const getLegal = (slug: string) => legal.find((entry) => entry.slug === slug);

export { getCv };

export type { BlogMeta, ContentEntry, LegalMeta, ProjectMeta };
