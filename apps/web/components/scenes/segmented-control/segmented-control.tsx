'use client';

import { useId } from 'react';

import styles from './segmented-control.module.css';

import type { KeyboardEvent } from 'react';

export interface SegmentedOption {
  id: string;
  label: string;
}

/**
 * A pill with two or three choices and a thumb that slides to the chosen one (`--dur-slide`).
 * Controlled: `value` and `onValueChange` belong to the parent, which also decides what the choice
 * changes. Native radios in a `fieldset`, so the browser's own behaviour is the baseline; the arrow
 * keys are handled here as well so the chosen option and focus move together everywhere.
 *
 * A11y: `fieldset` + `legend` (visually hidden) + radios with their labels, one tab stop, arrows
 * (left/up, right/down) wrap around; `aria-controls` names the panel the choice drives; focus ring
 * on the pill. 2.75 rem touch height on a coarse pointer. Contrast: `ink` on `violet` 6.4:1.
 */
export function SegmentedControl({
  legend,
  options,
  value,
  onValueChange,
  controls,
}: {
  legend: string;
  options: readonly SegmentedOption[];
  value: string;
  onValueChange: (id: string) => void;
  /** Id of the region the choice drives (the figure that changes). */
  controls?: string;
}) {
  const name = useId();
  const index = Math.max(0, options.findIndex((option) => option.id === value));

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = options[(index + step + options.length) % options.length];
    if (!next) return;
    onValueChange(next.id);
    document.getElementById(`${name}-${next.id}`)?.focus();
  }

  return (
    <fieldset className={styles.seg} data-index={index} data-count={options.length}>
      <legend className="sr-only">{legend}</legend>
      <span className={styles.thumb} aria-hidden="true" />
      {options.map((option) => (
        <label key={option.id} className={styles.option}>
          <input
            id={`${name}-${option.id}`}
            className="sr-only"
            type="radio"
            name={name}
            value={option.id}
            checked={option.id === value}
            aria-controls={controls}
            onChange={() => onValueChange(option.id)}
            onKeyDown={onKeyDown}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
