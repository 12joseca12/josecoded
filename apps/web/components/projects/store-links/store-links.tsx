import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';

import styles from './store-links.module.css';

import type { Href } from '@josecoded/types';

export type ProofKind = 'appStore' | 'play' | 'web' | 'repo';

/**
 * The links that prove a project: its App Store and Google Play pages, the site and the code, as the
 * sheet lists them (a pending id is not a link). The first one is the primary action of the page; the
 * rest are secondary. Names only: never a rating, an install count or a number of reviews (the site
 * publishes no metrics).
 *
 * A11y: a named group of real links; each name says where it goes; the first is the solid button.
 */
export function StoreLinks({
  links,
  labels,
  groupLabel,
}: {
  links: readonly { kind: ProofKind; href: string }[];
  labels: Record<ProofKind, string>;
  groupLabel: string;
}) {
  if (links.length === 0) return null;
  return (
    <div className={styles.row} role="group" aria-label={groupLabel}>
      {links.map((link, index) =>
        index === 0 ? (
          <Button key={link.kind} href={link.href as Href} icon={link.kind === 'web' ? 'globe' : 'store'}>
            {labels[link.kind]}
          </Button>
        ) : (
          <ArrowLink key={link.kind} href={link.href as Href} emphasis="strong">
            {labels[link.kind]}
          </ArrowLink>
        ),
      )}
    </div>
  );
}
