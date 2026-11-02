// Order of the projects index (UX v4.0 §4.5): by number of verifiable proofs, then recency, then the sheet's own
// `order`. A reduced sheet (`hideMetrics`, the NDA one) and the site itself never take the first place: the
// first place goes to a project built for someone else. Pure, so the script and the page share it.
// Runs under plain Node (scripts/content-index.ts): internal imports carry `.ts`.
import { isPendingDato } from '../../lib/content/dato.ts';

export interface Rankable {
  slug: string;
  proofs: Record<string, string | undefined>;
  hideMetrics?: boolean;
  year: number | string;
  order?: number;
  /** The site itself: the most direct proof, but never the first place. */
  self?: boolean;
}

/** Proofs that really exist: a `{{DATO}}` marker is a pending link, not a proof. */
export function proofCount(project: Pick<Rankable, 'proofs'>): number {
  return Object.values(project.proofs).filter((value) => value !== undefined && value.trim() !== '' && !isPendingDato(value)).length;
}

const yearOf = (year: number | string) => (typeof year === 'number' ? year : 0);
const isRestricted = (project: Rankable) => project.hideMetrics === true || project.self === true;

export function rankProjects<T extends Rankable>(projects: readonly T[]): T[] {
  const sorted = [...projects].sort(
    (a, b) =>
      proofCount(b) - proofCount(a) ||
      yearOf(b.year) - yearOf(a.year) ||
      (a.order ?? 0) - (b.order ?? 0) ||
      a.slug.localeCompare(b.slug),
  );
  const first = sorted.findIndex((project) => !isRestricted(project));
  if (first > 0) {
    const [lead] = sorted.splice(first, 1);
    if (lead) sorted.unshift(lead);
  }
  return sorted;
}
