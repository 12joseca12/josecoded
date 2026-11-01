export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Marker {
  /** Distance from the start of the list to the start of the target, along the axis. */
  offset: number;
  /** Length of the target along the axis. */
  size: number;
  /** Passed through: the space the marker keeps below (or beside) the target. */
  gap: number;
}

/**
 * Where a sliding marker (the highlight of the routes list, the bar under the packs) goes to sit on
 * `target`, measured from `list`. `axis` is the direction the marker slides: 'x' for the packs bar,
 * 'y' for the list highlight. Pure arithmetic; the island applies it as `--x`/`--w` or `--y`/`--h`.
 */
export function markerFor(list: Box, target: Box, axis: 'x' | 'y', gap: number): Marker {
  return axis === 'x'
    ? { offset: target.left - list.left, size: target.width, gap }
    : { offset: target.top - list.top, size: target.height, gap };
}
