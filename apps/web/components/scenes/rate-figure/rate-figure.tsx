'use client';

import { useId, useState } from 'react';

import { SegmentedControl } from '@/components/scenes/segmented-control';
import { ArrowLink } from '@/components/ui/arrow-link';

import styles from './rate-figure.module.css';

import type { Href } from '@josecoded/types';

export interface RateOption {
  id: string;
  /** Label of the choice («Por horas»). */
  label: string;
  /** The big figure («40 €/h»), already formatted from `@josecoded/pricing`. */
  figure: string;
  text: string;
  link: { href: Href; label: string };
}

/**
 * «Tarifas»: a two-way switch and, under it, the big figure of the chosen rate with one line of
 * text and the link that follows the choice. The figure swaps with a short blur-and-rise (only
 * after the person chooses, never on load); with reduced motion it just changes.
 *
 * A11y: the figure region is `aria-live="polite"`, so the new rate is announced when the choice
 * changes; the switch names the region with `aria-controls`.
 */
export function RateFigure({ legend, options }: { legend: string; options: readonly RateOption[] }) {
  const region = useId();
  const [value, setValue] = useState(options[0]?.id ?? '');
  const [changed, setChanged] = useState(false);
  const current = options.find((option) => option.id === value) ?? options[0];

  return (
    <div className={styles.rate}>
      <SegmentedControl
        legend={legend}
        options={options.map(({ id, label }) => ({ id, label }))}
        value={value}
        onValueChange={(id) => {
          setChanged(true);
          setValue(id);
        }}
        controls={region}
      />
      <div id={region} className={styles.region} aria-live="polite">
        {current ? (
          <>
            <b key={current.id} className={styles.figure} data-swap={changed ? 'true' : undefined}>
              {current.figure}
            </b>
            <p className={styles.text}>{current.text}</p>
            <ArrowLink href={current.link.href} emphasis="strong">
              {current.link.label}
            </ArrowLink>
          </>
        ) : null}
      </div>
    </div>
  );
}
