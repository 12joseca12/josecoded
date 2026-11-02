import styles from './paging-demo.module.css';

import type { KeyboardEvent, Ref } from 'react';

/** Blocks of each mini scene, out of six columns: (width, tall). */
const BLOCKS: readonly (readonly (readonly [number, boolean])[])[] = [
  [[4, true], [2, false], [2, false]],
  [[6, false], [3, false], [3, false]],
  [[2, true], [4, false], [4, false]],
];

/**
 * The scenes of the paging demo, as the static poster and the island both draw them: a viewport of three
 * stacked scenes and its pager. Plain markup with no state: the island adds the keys, the wheel and the controls.
 * With no `interactive` it is a still image (first scene) and not a tab stop.
 */
export function PagingStage({
  scenes,
  viewport,
  index = 0,
  interactive = false,
  viewRef,
  onKeyDown,
}: {
  scenes: readonly string[];
  /** Accessible name of the viewport. */
  viewport: string;
  index?: number;
  interactive?: boolean;
  viewRef?: Ref<HTMLDivElement>;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className={styles.stage}>
      <div
        ref={viewRef}
        className={styles.view}
        role={interactive ? 'region' : undefined}
        aria-label={interactive ? viewport : undefined}
        aria-hidden={interactive ? undefined : 'true'}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={onKeyDown}
      >
        {scenes.map((name, i) => (
          <section key={name} className={styles.scene} aria-label={name}>
            <p className={styles.name}>
              <span className={styles.number} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              {name}
            </p>
            <div className={styles.bento} aria-hidden="true">
              {(BLOCKS[i] ?? []).map(([width, tall], block) => (
                <i key={block} className={styles.block} data-w={width} data-tall={tall ? 'true' : undefined} />
              ))}
            </div>
          </section>
        ))}
      </div>
      <ol className={styles.dots} aria-hidden="true">
        {scenes.map((name, i) => (
          <li key={name} className={styles.dot} data-active={i === index ? 'true' : undefined} />
        ))}
      </ol>
    </div>
  );
}
