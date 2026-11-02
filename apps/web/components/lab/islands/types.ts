export interface PagingLabels {
  viewport: string;
  scenes: string[];
  prev: string;
  next: string;
  /** «Escena {n} de {total}». */
  position: string;
  duration: string;
  threshold: string;
  /** «{value} ms». */
  ms: string;
  /** «{value} px». */
  px: string;
  /** How the demo is handled («Rueda, flechas o botones»). */
  hint: string;
}

export interface MarkerLabels {
  axis: string;
  y: string;
  x: string;
  list: string;
  items: string[];
  hint: string;
}

export interface IslandLabels {
  paging: PagingLabels;
  marker: MarkerLabels;
}

/** What every island receives: its translated texts. */
export interface IslandProps<K extends keyof IslandLabels> {
  labels: IslandLabels[K];
}

/** The way the marker slides: down a list (`y`) or along a row (`x`). */
export type MarkerAxis = 'x' | 'y';
