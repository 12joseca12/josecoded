import { Card } from "@/components/ui/Card/Card";
import type { RateItem } from "@/types/services";

import styles from "./RateFigure.module.css";

interface RateFigureProps {
  label: string;
  note: string;
  provisionalLabel?: string;
  items: RateItem[];
}

export function RateFigure({ label, note, provisionalLabel, items }: RateFigureProps) {
  return (
    <figure
      className={styles.rates}
      aria-label={label}
      data-status={provisionalLabel ? "provisional" : "final"}
    >
      <dl className={styles.list}>
        {items.map((item) => (
          <Card key={item.id} size="sm" className={styles.item}>
            <dt className={styles.term}>
              {item.label}
              {provisionalLabel ? (
                <span className={styles.tag} data-provisional="">
                  {provisionalLabel}
                </span>
              ) : null}
            </dt>
            <dd className={styles.value}>
              {item.prefix ? <span className={styles.unit}>{item.prefix}</span> : null}
              <strong>{item.value}</strong>
              <span className={styles.unit}>{item.unit}</span>
            </dd>
          </Card>
        ))}
      </dl>
      <figcaption className={styles.note}>{note}</figcaption>
    </figure>
  );
}
