import { Card } from "@/components/ui/Card/Card";
import { PriceState } from "@/components/ui/PriceState/PriceState";
import type { RateItem } from "@/types/services";

import styles from "./RateFigure.module.css";

interface RateFigureProps {
  label: string;
  note: string;
  review?: string;
  items: RateItem[];
}

export function RateFigure({ label, note, review, items }: RateFigureProps) {
  return (
    <figure className={styles.rates} aria-label={label} data-status={review ? "review" : "final"}>
      <dl className={styles.list}>
        {items.map((item) => (
          <Card key={item.id} size="sm" className={styles.item}>
            <dt className={styles.term}>{item.label}</dt>
            <dd className={styles.value}>
              {review ? (
                <PriceState variant="review" label={review} />
              ) : (
                <PriceState
                  variant="final"
                  prefix={item.prefix}
                  amount={item.value}
                  unit={item.unit}
                />
              )}
            </dd>
          </Card>
        ))}
      </dl>
      <figcaption className={styles.note}>{note}</figcaption>
    </figure>
  );
}
