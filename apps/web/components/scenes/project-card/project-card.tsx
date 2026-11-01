import Image from 'next/image';

import { ArrowLink } from '@/components/ui/arrow-link';
import { Icon } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';

import styles from './project-card.module.css';

import type { Href } from '@josecoded/types';
import type { ReactNode } from 'react';

export interface ProjectCardProps {
  /** Slug, used for the ids; the card is `data-tcard` so the tour can find it. */
  slug: string;
  name: string;
  /** One sentence about what it does; `null` while it is pending (the sentence is left out). */
  lead: ReactNode;
  kind: 'app' | 'web';
  /** Translated kind («App», «Web»). */
  kindLabel: string;
  /** Glyph art: the phone for an app, the browser for a web. Decorative. */
  art: string;
  href: Href;
  /** «Ver proyecto». */
  linkLabel: string;
  /** Accessible name of the link, starting with the visible text («Ver proyecto 3cat»). */
  linkName: string;
}

/**
 * A project of the tour: the glyph art with a glow behind it, the name, a sentence, the kind of
 * project and the link to its page. The art has a reserved 801 / 722 box, so nothing jumps while
 * it loads. The card in the middle of the tour is `data-active` (set by the tour).
 *
 * A11y: an `article` named by its `h3`; the art is decorative (`aria-hidden`); the link carries
 * the project's name in its accessible name, so three «Ver proyecto» are told apart.
 */
export function ProjectCard({ slug, name, lead, kind, kindLabel, art, href, linkLabel, linkName }: ProjectCardProps) {
  const titleId = `project-${slug}`;
  return (
    <Surface as="article" radius="tcard" aria-labelledby={titleId} data-tcard="" data-kind={kind}>
      <div className={styles.inner}>
        <div className={styles.art} aria-hidden="true">
          <Image src={art} alt={DECORATIVE} width={801} height={722} loading="lazy" />
        </div>
        <div className={styles.copy}>
          <h3 id={titleId} className={styles.name}>
            {name}
          </h3>
          {lead ? <p className={styles.lead}>{lead}</p> : null}
          <p className={styles.meta}>
            <Icon name={kind === 'app' ? 'smartphone' : 'globe'} />
            {kindLabel}
          </p>
          <ArrowLink href={href} emphasis="strong" aria-label={linkName}>
            {linkLabel}
          </ArrowLink>
        </div>
      </div>
    </Surface>
  );
}

// an empty alt is not text: the art is decorative and the whole box is aria-hidden
const DECORATIVE = '';
