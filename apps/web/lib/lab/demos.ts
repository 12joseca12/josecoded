/** The islands that exist (`components/lab/islands`). */
export type LabIsland = 'paging' | 'marker';

/** Tag of a demo (`lab.tag.*` in the messages). */
export type LabTag = 'motion';

export interface LabDemo {
  slug: string;
  /** Key of `lab.demos.*` and of the island that runs it. */
  id: LabIsland;
  tags: readonly LabTag[];
}

/**
 * The two candidate demos of the lab (block B09): the page-by-gesture pager and the sliding marker that already drive
 * the home. Jose confirms them when he sees them; the content pipeline (`content/lab`, block B10) replaces this list.
 */
export const LAB_DEMOS: readonly LabDemo[] = [
  { slug: 'paginado-por-gesto', id: 'paging', tags: ['motion'] },
  { slug: 'seleccion-deslizante', id: 'marker', tags: ['motion'] },
];

export const labDemo = (slug: string): LabDemo | undefined => LAB_DEMOS.find((demo) => demo.slug === slug);
