'use client';

import { useId, useState, useSyncExternalStore } from 'react';

import { resolveVia } from '@/lib/leads/schema';

import styles from './via-tabs.module.css';

import type { ContactVia } from '@/lib/leads/schema';
import type { KeyboardEvent, ReactNode } from 'react';

export interface Via {
  id: ContactVia;
  label: string;
  /** What the way shows; always in the document so crawlers and visitors without a choice read it. */
  panel: ReactNode;
  /** Mounted only while the way is chosen (a form and its Turnstile widget). */
  live?: ReactNode;
}

const subscribeNothing = () => () => undefined;

function readHint(): string {
  let remembered = '';
  try {
    remembered = sessionStorage.getItem('audience') ?? '';
  } catch {
    // storage blocked: no memory, the default way
  }
  return `${window.location.search}|${remembered}`;
}

/**
 * The four ways to get in touch as tabs: client, agency, hiring, anything else. The starting one comes
 * from `?via=`, then from the audience the visitor's session remembers, then `client`. Every panel's
 * text stays in the HTML; only the chosen one is shown, and only its `live` part (the form) is mounted.
 *
 * A11y: tablist with arrow keys, Home and End and one tab stop; each tab controls its own tabpanel;
 * hidden panels use `hidden`, so they leave the reading order.
 */
export function ViaTabs({ label, vias }: { label: string; vias: readonly Via[] }) {
  const [picked, setPicked] = useState<ContactVia | null>(null);
  const hint = useSyncExternalStore(subscribeNothing, readHint, () => '|');
  const [search = '', remembered = ''] = hint.split('|');
  const initial = resolveVia(search, remembered || null);
  const selected = picked ?? initial;
  const uid = useId();

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = vias.length - 1;
    const to =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : -1;
    const next = vias[to];
    if (!next) return;
    event.preventDefault();
    setPicked(next.id);
    document.getElementById(`${uid}-tab-${next.id}`)?.focus();
  }

  return (
    <div className={styles.wrap}>
      <div role="tablist" aria-label={label} className={styles.tabs}>
        {vias.map((via, index) => (
          <button
            key={via.id}
            id={`${uid}-tab-${via.id}`}
            type="button"
            role="tab"
            aria-selected={via.id === selected}
            aria-controls={`${uid}-panel-${via.id}`}
            tabIndex={via.id === selected ? 0 : -1}
            className={styles.tab}
            onClick={() => setPicked(via.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {via.label}
          </button>
        ))}
      </div>
      {vias.map((via) => (
        <div
          key={via.id}
          id={`${uid}-panel-${via.id}`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${via.id}`}
          hidden={via.id !== selected}
          className={styles.panel}
        >
          {via.panel}
          {via.id === selected ? via.live : null}
        </div>
      ))}
    </div>
  );
}
