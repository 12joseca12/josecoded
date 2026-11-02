import styles from './process-steps.module.css';

import type { ReactNode } from 'react';

export interface ProcessStep {
  id: string;
  title: string;
  /** `null` while the text is pending. */
  text?: ReactNode;
}

/**
 * How the work goes, as an ordered list: a number, a title and a sentence per step. The numbers are
 * drawn by CSS from the list order, so the markup stays a plain `ol`.
 *
 * A11y: native ordered list (the order is announced); the number is decoration of the list marker.
 */
export function ProcessSteps({ steps }: { steps: readonly ProcessStep[] }) {
  return (
    <ol className={styles.steps}>
      {steps.map((step) => (
        <li key={step.id} className={styles.step}>
          <h3 className={styles.title}>{step.title}</h3>
          {step.text ? <p className={styles.text}>{step.text}</p> : null}
        </li>
      ))}
    </ol>
  );
}
