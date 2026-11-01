import { CellText } from '@/components/scenes/cell-text';
import { ArrowLink } from '@/components/ui/arrow-link';

import styles from './demo-card.module.css';

import type { Href } from '@josecoded/types';
import type { ReactNode } from 'react';

/** The three mini scenes of the poster: the width and height of each block, out of twelve columns. */
const SCENES: readonly (readonly (readonly [number, 1 | 2])[])[] = [
  [[7, 2], [5, 1], [5, 1]],
  [[12, 1], [7, 1], [5, 1]],
  [[6, 2], [3, 2], [3, 2]],
];

/**
 * Body of the Lab cell: the miniature of the demo (three scenes that page by gesture, CSS only),
 * its name, one sentence and the link to try it. The miniature is a still poster until the cell
 * is hovered or has focus inside (it pauses where it is), and never moves with reduced motion.
 * The name and the sentence come from the demo's content; while pending they are `{{DATO}}` markers.
 *
 * A11y: the miniature is `aria-hidden` (the text next to it says what the demo is); the link says
 * what it does and names the demo in its accessible name (`linkName`).
 */
export function DemoCard({
  name,
  lead,
  href,
  linkLabel,
  linkName,
}: {
  name: ReactNode;
  lead: ReactNode;
  href: Href;
  linkLabel: string;
  linkName?: string;
}) {
  return (
    <>
      <div className={styles.demo} aria-hidden="true">
        <div className={styles.screen}>
          <div className={styles.track}>
            {SCENES.map((blocks, scene) => (
              <div key={scene} className={styles.scene}>
                <i className={styles.title} />
                <div className={styles.bento}>
                  {blocks.map(([width, rows], block) => (
                    <i key={block} className={styles.block} data-w={width} data-t={rows === 2 ? '2' : undefined} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.pager}>
            <i className={styles.dot} />
            <i className={styles.dot} />
            <i className={styles.dot} />
          </div>
        </div>
      </div>
      {name ? <CellText variant="title">{name}</CellText> : null}
      {lead ? <CellText>{lead}</CellText> : null}
      <ArrowLink href={href} emphasis="strong" aria-label={linkName}>
        {linkLabel}
      </ArrowLink>
    </>
  );
}
