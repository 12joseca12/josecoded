'use client';

import { lazy, Suspense, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { announce } from '@/lib/a11y';

import styles from './demo-frame.module.css';

import type { IslandLabels } from '@/components/lab/islands/types';
import type { LabIsland } from '@/lib/lab/demos';
import type { ReactNode } from 'react';

// the islands load on the first interaction, never with the page
const PagingDemo = lazy(() => import('@/components/lab/islands/paging-demo'));
const MarkerDemo = lazy(() => import('@/components/lab/islands/marker-demo'));

const subscribeNever = () => () => {};

export interface DemoFrameProps {
  id: LabIsland;
  /** Accessible name of the frame («Demo: Paginado por gesto»). */
  label: string;
  /** The still, rendered on the server (`DemoPoster`). */
  poster: ReactNode;
  labels: IslandLabels;
  texts: { start: string; restart: string; still: string; running: string; stopped: string };
}

/**
 * The frame of a demo (PANT P23): the still served by the server, and the island that replaces it on the first
 * interaction («Probar la demo»). «Reiniciar» mounts the island again from its first state. Before hydration there
 * is no button, only the still and its note. With reduced motion the demos do not animate: the pager jumps and
 * the marker appears in place (their own contracts).
 *
 * A11y: a `section` named after the demo; the still is a picture (`aria-hidden`) and the note says so; the
 * start and restart buttons are real buttons of 2.75 rem or more; start and restart are announced politely; the
 * island is a normal tab stop inside the frame.
 */
export function DemoFrame({ id, label, poster, labels, texts }: DemoFrameProps) {
  const live = useSyncExternalStore(subscribeNever, () => true, () => false); // false on the server and while hydrating
  const [started, setStarted] = useState(false);
  const [run, setRun] = useState(0);

  function start() {
    setStarted(true);
    announce(texts.running);
  }
  function restart() {
    setRun((value) => value + 1);
    announce(texts.stopped);
  }

  return (
    <section className={styles.frame} aria-label={label} data-testid="demo-frame" data-started={started ? 'true' : undefined}>
      <div className={styles.stage}>
        {started ? (
          <Suspense fallback={poster}>
            <div key={run} className={styles.island}>
              {id === 'paging' ? <PagingDemo labels={labels.paging} /> : <MarkerDemo labels={labels.marker} />}
            </div>
          </Suspense>
        ) : (
          <>
            {poster}
            {live ? (
              <div className={styles.cover}>
                <Button icon="flask-conical" onClick={start}>
                  {texts.start}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className={styles.bar}>
        <p className={styles.hint}>{started ? labels[id].hint : texts.still}</p>
        {started ? (
          <Button variant="ghost" onClick={restart}>
            {texts.restart}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
