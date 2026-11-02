import { ArrowLink } from '@/components/ui/arrow-link';
import { Chip } from '@/components/ui/chip';
import { Link } from '@/i18n/navigation';

import styles from './post-header.module.css';

import type { Href, Locale } from '@josecoded/types';
import type { ReactNode } from 'react';

export interface PostHeaderProps {
  /** The guide's title: a node, so a pending `{{DATO}}` text shows its marker outside production. */
  title: ReactNode;
  description: ReactNode;
  date: { iso: string; label: string };
  /** «Actualizada el 3 nov 2026». */
  updated?: { iso: string; label: string };
  /** «12 min de lectura». */
  readingLabel: string;
  /** «Nivel: intermedio». */
  levelLabel?: string;
  tags: readonly string[];
  tagsLabel: string;
  /** «Solo en inglés»: the guide exists only in the other language. */
  languageNote?: string;
  back: { href: Href; label: string };
  /** A guide that exists in the other language only: says so and offers the site in that language. */
  otherLanguage?: { note: string; linkLabel: string; locale: Locale; slug: string };
}

/**
 * Head of a guide (PANT P10): the way back to the listing, date, reading time and level, the `h1`, the description and
 * the tags. The only `h1` of the page. A guide in the other language says so, with a link to the site in that language.
 *
 * A11y: the dates are `time` elements; the tags are a labelled list; the link back comes first in reading order.
 */
export function PostHeader({ title, description, date, updated, readingLabel, levelLabel, tags, tagsLabel, languageNote, back, otherLanguage }: PostHeaderProps) {
  return (
    <header className={styles.head}>
      <ArrowLink href={back.href} icon="arrow-left">
        {back.label}
      </ArrowLink>
      <p className={styles.meta}>
        <time dateTime={date.iso}>{date.label}</time>
        {updated ? <time dateTime={updated.iso}>{updated.label}</time> : null}
        <span>{readingLabel}</span>
        {levelLabel ? <span>{levelLabel}</span> : null}
        {languageNote ? <span className={styles.note}>{languageNote}</span> : null}
      </p>
      <h1 className={styles.title}>{title}</h1>
      {description ? <p className={styles.description}>{description}</p> : null}
      {otherLanguage ? (
        <p className={styles.other}>
          {otherLanguage.note}{' '}
          <Link href={{ pathname: '/blog/[slug]', params: { slug: otherLanguage.slug } }} locale={otherLanguage.locale} hrefLang={otherLanguage.locale} className={styles.switch}>
            {otherLanguage.linkLabel}
          </Link>
        </p>
      ) : null}
      {tags.length > 0 ? (
        <ul className={styles.tags} aria-label={tagsLabel}>
          {tags.map((tag) => (
            <li key={tag}>
              <Chip size="sm">{tag}</Chip>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
