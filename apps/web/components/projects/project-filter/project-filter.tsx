'use client';

import { useState, useSyncExternalStore } from 'react';


import { SegmentedControl } from '@/components/scenes/segmented-control';
import { EmptyState } from '@/components/shared/empty-state';

import styles from './project-filter.module.css';

import type { ReactNode } from 'react';

export type ProjectFilterId = 'all' | 'app' | 'web';

const subscribeNothing = () => () => undefined;

function typeFromUrl(): ProjectFilterId {
  const wanted = new URLSearchParams(window.location.search).get('tipo');
  return wanted === 'app' || wanted === 'web' ? wanted : 'all';
}

/**
 * Filter of the index: Todos · Apps · Webs, kept in the URL (`?tipo=app`) so it can be shared. Every
 * card is in the HTML; the filter only hides those of other kinds, so a crawler (and the page without
 * JavaScript) reads the whole list. With nothing left it says so.
 *
 * A11y: the filter is the same radio group as the rest of the site; hiding uses `hidden`; the empty
 * message is a polite status.
 */
export function ProjectFilter({
  items,
  labels,
}: {
  items: readonly { slug: string; kind: 'app' | 'web'; card: ReactNode }[];
  labels: { legend: string; all: string; app: string; web: string; empty: string; emptyText: string };
}) {
  const fromUrl = useSyncExternalStore(subscribeNothing, typeFromUrl, () => 'all' as ProjectFilterId);
  const [picked, setPicked] = useState<ProjectFilterId | null>(null);
  const value = picked ?? fromUrl;

  function choose(next: string) {
    const id = next === 'app' || next === 'web' ? next : 'all';
    setPicked(id);
    const url = new URL(window.location.href);
    if (id === 'all') url.searchParams.delete('tipo');
    else url.searchParams.set('tipo', id);
    window.history.replaceState(null, '', url);
  }

  const visible = items.filter((item) => value === 'all' || item.kind === value);

  return (
    <div className={styles.wrap}>
      <SegmentedControl
        legend={labels.legend}
        value={value}
        onValueChange={choose}
        controls="project-list"
        options={[
          { id: 'all', label: labels.all },
          { id: 'app', label: labels.app },
          { id: 'web', label: labels.web },
        ]}
      />
      <div id="project-list" className={styles.list}>
        {items.map((item) => (
          <div key={item.slug} hidden={value !== 'all' && item.kind !== value}>
            {item.card}
          </div>
        ))}
      </div>
      {visible.length === 0 ? <EmptyState live title={labels.empty} text={labels.emptyText} /> : null}
    </div>
  );
}
