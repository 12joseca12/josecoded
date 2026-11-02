'use client';

import { useEffect, useRef, useState } from 'react';

import { SegmentedControl } from '@/components/scenes/segmented-control';
import { announce } from '@/lib/a11y';
import { markerFor } from '@/lib/motion/slide-marker';

import { MarkerStage } from './marker-stage';

import type { IslandProps, MarkerAxis } from './types';

/** Space between an element and the bar under it (horizontal axis). */
const BAR_GAP = 4;

/**
 * The sliding marker (`markerFor` of lib/motion/slide-marker.ts): the demo measures the chosen element and the group,
 * the function says where the marker goes and the island applies it as `--offset`, `--size` and `--top`.
 * The first placement does not slide, and neither does a change of axis; reduced motion never slides.
 */
export default function MarkerDemo({ labels }: IslandProps<'marker'>) {
  const list = useRef<HTMLDivElement>(null);
  const [axis, setAxis] = useState<MarkerAxis>('y');
  const [active, setActive] = useState(1);
  const [phase, setPhase] = useState<'idle' | 'ready' | 'slide'>('idle');

  useEffect(() => {
    const element = list.current;
    const marker = element?.querySelector<HTMLElement>('[data-marker]');
    if (!element || !marker) return;
    const place = () => {
      const target = element.querySelectorAll<HTMLElement>('[data-item]')[active];
      if (!target) return;
      const box = { left: 0, top: 0, width: element.offsetWidth, height: element.offsetHeight };
      const { offset, size, gap } = markerFor(
        box,
        { left: target.offsetLeft, top: target.offsetTop, width: target.offsetWidth, height: target.offsetHeight },
        axis,
        BAR_GAP,
      );
      marker.style.setProperty('--offset', `${offset}px`);
      marker.style.setProperty('--size', `${size}px`);
      marker.style.setProperty('--top', `${target.offsetTop + target.offsetHeight + gap}px`);
    };
    place();
    setPhase((current) => (current === 'idle' ? 'ready' : current));
    const frame = requestAnimationFrame(() => setPhase('slide'));
    const observer = new ResizeObserver(place);
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [axis, active]);

  function changeAxis(next: string) {
    setPhase('ready'); // the new layout is not a slide
    setAxis(next === 'x' ? 'x' : 'y');
  }

  function pick(index: number) {
    setActive(index);
    announce(labels.items[index] ?? '');
  }

  return (
    <>
      <MarkerStage items={labels.items} label={labels.list} axis={axis} active={active} ready={phase !== 'idle'} slide={phase === 'slide'} listRef={list} onPick={pick} />
      <SegmentedControl
        legend={labels.axis}
        options={[
          { id: 'y', label: labels.y },
          { id: 'x', label: labels.x },
        ]}
        value={axis}
        onValueChange={changeAxis}
      />
    </>
  );
}
