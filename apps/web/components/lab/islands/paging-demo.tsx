'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { announce } from '@/lib/a11y';
import { ease, keyDirection, nextStop, shouldHandleKey, stops } from '@/lib/motion/paging';

import styles from './paging-demo.module.css';
import { PagingStage } from './paging-stage';

import type { IslandProps } from './types';
import type { KeyboardEvent } from 'react';

const DURATION = { min: 200, max: 1400, step: 100 };
const THRESHOLD = { min: 20, max: 200, step: 10 };

/**
 * The home's pager in a box (`stops`, `nextStop`, `ease`, `keyDirection` and `shouldHandleKey` of
 * lib/motion/paging.ts): one gesture, one scene. The wheel moves a scene once its accumulated delta passes the threshold
 * and is locked while the glide runs; at the first and last scene it is left to the page. The glide is cancellable
 * and, with reduced motion, a jump to the final position.
 */
export default function PagingDemo({ labels }: IslandProps<'paging'>) {
  const view = useRef<HTMLDivElement>(null);
  const glide = useRef({ raf: 0, to: 0, lockUntil: 0, delta: 0, last: 0 });
  const [index, setIndex] = useState(0);
  const [duration, setDuration] = useState(600);
  const [threshold, setThreshold] = useState(60);
  const settings = useRef({ duration, threshold });
  useEffect(() => {
    settings.current = { duration, threshold };
  });

  const stopList = (element: HTMLElement) =>
    stops([...element.children].map((child) => ({ top: (child as HTMLElement).offsetTop, height: (child as HTMLElement).offsetHeight })), element.clientHeight, 0.85);

  function slide(element: HTMLElement, to: number) {
    const state = glide.current;
    cancelAnimationFrame(state.raf);
    state.to = to;
    const next = Math.round(to / element.clientHeight);
    setIndex(next);
    announce(labels.position.replace('{n}', String(next + 1)).replace('{total}', String(labels.scenes.length)));
    const from = element.scrollTop;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === to) {
      element.scrollTop = to;
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / settings.current.duration);
      element.scrollTop = from + (to - from) * ease(t);
      if (t < 1) state.raf = requestAnimationFrame(step);
    };
    state.raf = requestAnimationFrame(step);
  }

  /** Moves one scene; false when there is none that way. */
  function page(dir: 1 | -1) {
    const element = view.current;
    if (!element) return false;
    const next = nextStop(stopList(element), glide.current.to, dir);
    if (next === undefined) return false;
    slide(element, next);
    return true;
  }

  useEffect(() => {
    const element = view.current;
    if (!element) return;
    const state = glide.current;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      const dir = event.deltaY > 0 ? 1 : -1;
      if (nextStop(stopList(element), state.to, dir) === undefined) return; // the ends belong to the page
      event.preventDefault();
      const now = performance.now();
      if (now - state.last > 220) state.delta = 0; // a new gesture
      state.last = now;
      state.delta += event.deltaY;
      if (now < state.lockUntil || Math.abs(state.delta) < settings.current.threshold) return;
      page(state.delta > 0 ? 1 : -1);
      state.delta = 0;
      state.lockUntil = now + settings.current.duration;
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      element.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(state.raf);
    };
    // the handler reads everything it needs from refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const element = view.current;
    if (!element || !shouldHandleKey(event.nativeEvent, event.target as Element)) return;
    const direction = keyDirection(event.nativeEvent);
    if (direction === null) return;
    event.preventDefault();
    if (direction === 'home') slide(element, 0);
    else if (direction === 'end') slide(element, element.scrollHeight - element.clientHeight);
    else page(direction);
  }

  const last = labels.scenes.length - 1;
  return (
    <>
      <PagingStage scenes={labels.scenes} viewport={labels.viewport} index={index} interactive viewRef={view} onKeyDown={onKeyDown} />
      <div className={styles.controls}>
        <div className={styles.row}>
          <Button variant="ghost" iconOnly icon="chevron-left" aria-label={labels.prev} disabled={index === 0} onClick={() => page(-1)} />
          <Button variant="ghost" iconOnly icon="chevron-right" aria-label={labels.next} disabled={index === last} onClick={() => page(1)} />
          <p className={styles.position}>{labels.position.replace('{n}', String(index + 1)).replace('{total}', String(labels.scenes.length))}</p>
        </div>
        <div className={styles.ranges}>
          <label className={styles.range}>
            <span>
              {labels.duration} <output>{labels.ms.replace('{value}', String(duration))}</output>
            </span>
            <input type="range" {...DURATION} value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
          </label>
          <label className={styles.range}>
            <span>
              {labels.threshold} <output>{labels.px.replace('{value}', String(threshold))}</output>
            </span>
            <input type="range" {...THRESHOLD} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />
          </label>
        </div>
      </div>
    </>
  );
}
