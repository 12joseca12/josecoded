import { CursorLight } from '@/components/scenes/cursor-light';
import reveal from '@/components/scenes/scene/reveal.module.css';

import styles from './bento.module.css';

import type { ReactNode } from 'react';

/**
 * The grid of a scene, composed in JSX: `<Bento><BentoCell span={7} tall>…</BentoCell></Bento>`.
 * It lays out by the width of its own container, not the viewport: one column, two from 34 rem and
 * twelve from 52 rem (each cell takes its `span` of the twelve). It owns the one pointer listener
 * that lights the cell under the cursor (`CursorLight`) and the scroll-driven entry of its cells.
 */
export function Bento({ children }: { children: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <div className={`${styles.bento} ${reveal.group}`}>
        {children}
        <CursorLight />
      </div>
    </div>
  );
}
