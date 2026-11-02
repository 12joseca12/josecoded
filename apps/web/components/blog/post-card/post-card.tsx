import { ArrowLink } from '@/components/ui/arrow-link';
import { Chip } from '@/components/ui/chip';
import { Surface } from '@/components/ui/surface';

import styles from './post-card.module.css';

import type { Href, Locale } from '@josecoded/types';
import type { ReactNode } from 'react';

export interface PostCardProps {
  /** Slug, used for the ids. */
  slug: string;
  /** Title and description arrive as nodes: a pending `{{DATO}}` text is the visible marker (or `null` in production). */
  title: ReactNode;
  description: ReactNode;
  /** `2026-11-02` and its translated form («2 nov 2026»). */
  date: { iso: string; label: string };
  /** «12 min de lectura». */
  readingLabel: string;
  tags: readonly string[];
  /** Accessible name of the tag list («Etiquetas»). */
  tagsLabel: string;
  /** Language the guide is written in, when it is not the page's: sets `lang` and shows `languageNote`. */
  lang?: Locale;
  /** «Solo en inglés». */
  languageNote?: string;
  href: Href;
  /** «Leer guía». */
  linkLabel: string;
  /** Accessible name of the link, starting with the visible text («Leer guía: Next.js 16 en Workers»). */
  linkName: string;
}

/**
 * A guide of the listing (PANT P9): date and reading time, the title, the description, the tags and the link to the
 * guide. A guide that exists only in the other language says so and carries its own `lang`.
 *
 * A11y: an `article` named by its `h3`; the date is a `time`; the tags are a labelled list; the one link carries the
 * guide's title in its accessible name, so several «Leer guía» are told apart. Nothing interactive is nested.
 */
export function PostCard({ slug, title, description, date, readingLabel, tags, tagsLabel, lang, languageNote, href, linkLabel, linkName }: PostCardProps) {
  const titleId = `post-${slug}`;
  return (
    <Surface as="article" radius="tcard" interactive aria-labelledby={titleId} lang={lang}>
      <div className={styles.inner}>
        <p className={styles.meta}>
          <time dateTime={date.iso}>{date.label}</time>
          <span className={styles.reading}>{readingLabel}</span>
          {languageNote ? <span className={styles.note}>{languageNote}</span> : null}
        </p>
        <h3 id={titleId} className={styles.title}>
          {title}
        </h3>
        {description ? <p className={styles.description}>{description}</p> : null}
        {tags.length > 0 ? (
          <ul className={styles.tags} aria-label={tagsLabel}>
            {tags.map((tag) => (
              <li key={tag}>
                <Chip size="sm">{tag}</Chip>
              </li>
            ))}
          </ul>
        ) : null}
        <ArrowLink href={href} emphasis="strong" aria-label={linkName}>
          {linkLabel}
        </ArrowLink>
      </div>
    </Surface>
  );
}
