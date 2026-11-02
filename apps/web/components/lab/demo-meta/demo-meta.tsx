import { Chip } from '@/components/ui/chip';

import styles from './demo-meta.module.css';

import type { ReactNode } from 'react';

export interface DemoMetaProps {
  /** «Ficha de la demo». */
  title: string;
  /** «Tipo» and its tags. */
  tags: { term: string; items: readonly string[]; label: string };
  facts: readonly { id: string; term: string; value: ReactNode }[];
}

/**
 * The data sheet of a demo (PANT P23): its type, how it is handled, what it does with reduced motion and what it is
 * built with. A definition list the reader (and a model) can quote; a fact with no value has no row.
 *
 * A11y: a `dl` inside a section named by its heading; the tags are a labelled list.
 */
export function DemoMeta({ title, tags, facts }: DemoMetaProps) {
  const shown = facts.filter((fact) => fact.value);
  return (
    <section className={styles.meta} aria-labelledby="demo-meta-title">
      <h2 id="demo-meta-title" className={styles.title}>
        {title}
      </h2>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt className={styles.term}>{tags.term}</dt>
          <dd className={styles.value}>
            <ul className={styles.tags} aria-label={tags.label}>
              {tags.items.map((tag) => (
                <li key={tag}>
                  <Chip size="sm">{tag}</Chip>
                </li>
              ))}
            </ul>
          </dd>
        </div>
        {shown.map((fact) => (
          <div key={fact.id} className={styles.row}>
            <dt className={styles.term}>{fact.term}</dt>
            <dd className={styles.value}>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
