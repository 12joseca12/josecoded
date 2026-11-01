import styles from './surface.module.css';

import type { SurfaceLayer, SurfaceRadius } from '@josecoded/types';
import type { ComponentPropsWithoutRef } from 'react';

export type SurfaceProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'style'> & {
  /** `cell` for bento cells, `tcard` (rounder) for project cards. */
  radius?: SurfaceRadius;
  /** `card` rests on the page; `overlay` floats above it (open cell, menu, palette). */
  layer?: SurfaceLayer;
  /** Lifts the hairline on hover (fine pointer only). */
  interactive?: boolean;
  /** The element: `article` for a bento cell, `section` for a block with its own heading. */
  as?: 'div' | 'article' | 'section';
};

/**
 * Tinted glass sheet: card surface, hairline, top light and a long soft shadow. Blur only where the
 * browser supports `backdrop-filter`; elsewhere the sheet is opaque (working-agreements §6). It
 * carries no role: put the semantics (a section, an article, a dialog) on the element that uses it.
 */
export function Surface({
  as: Element = 'div',
  radius = 'cell',
  layer = 'card',
  interactive = false,
  ...rest
}: SurfaceProps) {
  return (
    <Element
      {...rest}
      className={styles.surface}
      data-radius={radius}
      data-layer={layer}
      data-interactive={interactive ? 'true' : undefined}
    />
  );
}
