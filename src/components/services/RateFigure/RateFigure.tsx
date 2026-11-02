import type { RateItem } from "@/types/services";

import styles from "./RateFigure.module.css";

interface RateFigureProps {
  label: string;
  note: string;
  items: RateItem[];
}

export function RateFigure({ label, note, items }: RateFigureProps) {
  return (
    <figure className={styles.rates} aria-label={label}>
      <dl className={styles.list}>
        {items.map((item) => (
          <div key={item.id} className={styles.item}>
            <dt className={styles.term}>{item.label}</dt>
            <dd className={styles.value}>
              <strong>{item.value}</strong>
              <span className={styles.unit}>{item.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
      <figcaption className={styles.note}>{note}</figcaption>
    </figure>
  );
}
