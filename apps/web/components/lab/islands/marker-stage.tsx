import styles from './marker-demo.module.css';

import type { MarkerAxis } from './types';
import type { Ref } from 'react';

/**
 * The elements and the marker of the sliding-selection demo, as the static poster and the island both draw them.
 * Without JavaScript the chosen element tints itself; once the island has measured, the marker takes that
 * tint over and slides (`data-ready`, `data-slide`). Plain markup with no state: the island passes `onPick`.
 */
export function MarkerStage({
  items,
  label,
  axis,
  active,
  ready = false,
  slide = false,
  listRef,
  onPick,
}: {
  items: readonly string[];
  /** Accessible name of the group. */
  label: string;
  axis: MarkerAxis;
  active: number;
  ready?: boolean;
  slide?: boolean;
  listRef?: Ref<HTMLDivElement>;
  onPick?: (index: number) => void;
}) {
  return (
    <div className={styles.stage}>
      <div
        ref={listRef}
        className={styles.list}
        role="group"
        aria-label={label}
        data-axis={axis}
        data-ready={ready ? 'true' : undefined}
        data-slide={slide ? 'true' : undefined}
      >
        <span className={styles.marker} data-marker aria-hidden="true" />
        {items.map((name, i) => (
          <button key={name} type="button" className={styles.item} data-item aria-pressed={i === active} onClick={onPick ? () => onPick(i) : undefined}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
