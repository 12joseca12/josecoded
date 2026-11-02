import { projects } from '@/content/projects';
import { rankProjects } from '@/content/projects/rank';
import { isPendingDato } from '@/lib/content/dato';

import type { Project, ProjectTexts } from '@/content/projects/schema';
import type { Locale } from '@josecoded/types';

/** The sheets in the order of the projects index (proofs, recency, never a reduced one or this site first). */
export function rankedProjects(): Project[] {
  return rankProjects(projects);
}

export function projectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

/** Order of the home tour and of the case-study pager: the sheet's own `order`. */
export function tourProjects(): Project[] {
  return [...projects].sort((a, b) => a.order - b.order);
}

export function projectTexts(project: Project, locale: Locale): ProjectTexts {
  return project.texts[locale];
}

/** `true` when the sentence of the project is real. A sheet without it is not indexed (a thin page). */
export function hasOneLiner(project: Project, locale: Locale): boolean {
  return !isPendingDato(project.texts[locale].oneLiner);
}

/** Proof links that exist, in the order the case shows them. Pending ids and URLs are dropped. */
export function proofLinks(project: Project): { kind: 'appStore' | 'play' | 'web' | 'repo'; href: string }[] {
  const real = (value: string | undefined): value is string => value !== undefined && value.trim() !== '' && !isPendingDato(value);
  const { appStoreId, playPackage, webUrl, repoUrl } = project.proofs;
  return [
    ...(real(appStoreId) ? [{ kind: 'appStore' as const, href: `https://apps.apple.com/app/id${appStoreId}` }] : []),
    ...(real(playPackage) ? [{ kind: 'play' as const, href: `https://play.google.com/store/apps/details?id=${playPackage}` }] : []),
    ...(real(webUrl) ? [{ kind: 'web' as const, href: webUrl }] : []),
    ...(real(repoUrl) ? [{ kind: 'repo' as const, href: repoUrl }] : []),
  ];
}
