'use client';

import { useId, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';

import styles from './pack-compare.module.css';

import type { Href } from '@josecoded/types';
import type { KeyboardEvent, ReactNode } from 'react';

export interface CompareColumn {
  code: string;
  name: string;
  kind: 'web' | 'app';
  /** «Desde 900 €», already formatted from `@josecoded/pricing`. */
  price: string;
  /** «1 semana». */
  weeks: string;
  includes: ReactNode;
  forWhom?: ReactNode;
  href: Href;
  /** Accessible name of the proposal link: the visible label plus the pack and its code. */
  requestName: string;
  /** The extended version of a pack (the app), shown inside its own column. */
  option?: { name: string; intro: string; includes: ReactNode };
}

export interface CompareLabels {
  caption: string;
  tabs: string;
  pack: string;
  includes: string;
  forWhom: string;
  weeks: string;
  price: string;
  request: string;
  option: string;
}

/**
 * Comparison of the packs: a real table (caption, column and row headers) with one column per pack.
 * In a wide container every column shows; in a narrow one (a phone) a tab per pack picks the single
 * column to show, and the rest stay in the document for crawlers and for the wide layout. `?pack=P2`
 * (the links of the home and of the strip) picks the starting pack. Prices are text, never an image.
 *
 * A11y: tabs with arrow keys, Home and End (one tab stop); the table is the tab panel; every
 * request link names its pack; hidden columns are `display: none`, so they leave the reading order.
 */
const subscribeNothing = () => () => undefined;

export function PackCompare({
  columns,
  labels,
  hash = 'packs',
}: {
  columns: readonly CompareColumn[];
  labels: CompareLabels;
  hash?: string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const uid = useId();

  // the starting pack comes from the URL (`?pack=`); reading it after hydration keeps the page static
  const search = useSyncExternalStore(subscribeNothing, () => window.location.search, () => '');
  const wanted = new URLSearchParams(search).get('pack')?.toUpperCase();
  const fromUrl = columns.find((column) => column.code === wanted)?.code;
  const selected = picked ?? fromUrl ?? columns[0]?.code ?? '';
  const setSelected = setPicked;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = columns.length - 1;
    const to =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : -1;
    const next = columns[to];
    if (!next) return;
    event.preventDefault();
    setSelected(next.code);
    document.getElementById(`${uid}-tab-${next.code}`)?.focus();
  }

  const flag = (code: string) => (code === selected ? '' : undefined);
  const hasForWhom = columns.some((column) => column.forWhom);

  return (
    <div className={styles.wrap} data-hash={hash}>
      <div role="tablist" aria-label={labels.tabs} className={styles.tabs}>
        {columns.map((column, index) => (
          <button
            key={column.code}
            id={`${uid}-tab-${column.code}`}
            type="button"
            role="tab"
            aria-selected={column.code === selected}
            aria-controls={`${uid}-panel`}
            tabIndex={column.code === selected ? 0 : -1}
            className={styles.tab}
            onClick={() => setSelected(column.code)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {column.code}
          </button>
        ))}
      </div>
      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${selected}`} className={styles.panel}>
        <table className={styles.table}>
          <caption className={styles.caption}>{labels.caption}</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.corner}>
                <span className="sr-only">{labels.pack}</span>
              </th>
              {columns.map((column) => (
                <th key={column.code} scope="col" className={styles.col} data-pack={column.code} data-selected={flag(column.code)}>
                  <span className={styles.code}>{column.code}</span>
                  <span className={styles.name}>{column.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className={styles.row}>
                {labels.price}
              </th>
              {columns.map((column) => (
                <td key={column.code} className={styles.cell} data-pack={column.code} data-selected={flag(column.code)}>
                  <strong className={styles.price}>{column.price}</strong>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className={styles.row}>
                {labels.weeks}
              </th>
              {columns.map((column) => (
                <td key={column.code} className={styles.cell} data-pack={column.code} data-selected={flag(column.code)}>
                  {column.weeks}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className={styles.row}>
                {labels.includes}
              </th>
              {columns.map((column) => (
                <td key={column.code} className={styles.cell} data-pack={column.code} data-selected={flag(column.code)}>
                  {column.includes}
                  {column.option ? (
                    <div className={styles.option}>
                      <p className={styles.optionTitle}>{labels.option}</p>
                      <p>{column.option.intro}</p>
                      <p>{column.option.includes}</p>
                    </div>
                  ) : null}
                </td>
              ))}
            </tr>
            {hasForWhom ? (
              <tr>
                <th scope="row" className={styles.row}>
                  {labels.forWhom}
                </th>
                {columns.map((column) => (
                  <td key={column.code} className={styles.cell} data-pack={column.code} data-selected={flag(column.code)}>
                    {column.forWhom}
                  </td>
                ))}
              </tr>
            ) : null}
            <tr>
              <th scope="row" className={styles.row}>
                <span className="sr-only">{labels.request}</span>
              </th>
              {columns.map((column) => (
                <td key={column.code} className={styles.cell} data-pack={column.code} data-selected={flag(column.code)}>
                  <Button href={column.href} variant="ghost" size="sm" aria-label={column.requestName}>
                    {labels.request}
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
