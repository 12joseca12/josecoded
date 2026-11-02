'use client';

import { useEffect, useRef } from 'react';

import { track } from '@/lib/analytics';

import styles from './track-click.module.css';

import type { EventMap, EventName } from '@/lib/analytics';
import type { ReactNode } from 'react';

/**
 * Sends an analytics event when a link or button inside is activated. The primitives (`Button`,
 * `ArrowLink`) take no `onClick` when they are links, so the click is observed from a wrapper that
 * takes no part in the layout (`display: contents`). The listener is attached once, in an effect.
 */
export function TrackClick<K extends EventName>({
  event,
  data,
  children,
}: {
  event: K;
  data: EventMap[K];
  children: ReactNode;
}) {
  const box = useRef<HTMLSpanElement>(null);
  // the payload is a plain object of strings: compare it by value so the listener is not rebuilt every render
  const key = JSON.stringify(data);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const onClick = (click: MouseEvent) => {
      if (click.target instanceof Element && click.target.closest('a, button')) {
        (track as (name: EventName, data?: unknown) => void)(event, JSON.parse(key));
      }
    };
    element.addEventListener('click', onClick);
    return () => element.removeEventListener('click', onClick);
  }, [event, key]);

  return (
    <span ref={box} className={styles.box}>
      {children}
    </span>
  );
}
