import { CellText } from '@/components/scenes/cell-text';
import { ArrowLink } from '@/components/ui/arrow-link';

import styles from './post-teaser.module.css';

import type { Href } from '@josecoded/types';
import type { ReactNode } from 'react';

/**
 * What a bento cell says about one article or demo: date or a small note, the title, optionally
 * the lead, and the link. `size="lg"` is the large cell (the latest article, 6 columns) with a
 * larger title and its lead; the default is the small one (3 columns). Everything arrives
 * translated; a pending piece is a `{{DATO}}` marker (or null in production, and then left out).
 *
 * A11y: the title is text in the cell, whose `h3` names it; the link says what it does («Leer»,
 * «Probar») and carries the title in its accessible name (`linkName`), so several are told apart.
 */
export function PostTeaser({
  note,
  title,
  lead,
  href,
  linkLabel,
  linkName,
  size = 'sm',
}: {
  note?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  href: Href;
  linkLabel: string;
  linkName?: string;
  size?: 'sm' | 'lg';
}) {
  return (
    <div className={styles.teaser}>
      {note ? <CellText variant="muted">{note}</CellText> : null}
      <CellText variant={size === 'lg' ? 'title' : 'title-sm'}>{title}</CellText>
      {lead ? <CellText>{lead}</CellText> : null}
      <ArrowLink href={href} emphasis="strong" aria-label={linkName}>
        {linkLabel}
      </ArrowLink>
    </div>
  );
}
