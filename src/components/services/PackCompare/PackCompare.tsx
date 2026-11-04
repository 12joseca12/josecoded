import { Button } from "@/components/ui/Button/Button";
import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import type { PackCardItem } from "@/types/services";

import styles from "./PackCompare.module.css";

interface PackCompareLabels {
  from: string;
  unit: string;
  price: string;
  includes: string;
  provisional: string;
}

interface PackCompareProps {
  labels: PackCompareLabels;
  items: PackCardItem[];
}

export function PackCompare({ labels, items }: PackCompareProps) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.slug} className={styles.entry}>
          <Card
            as="article"
            className={styles.pack}
            data-pack={item.slug}
            data-status={item.provisional ? "provisional" : "final"}
          >
            <Heading level={3} size="h4">
              {item.name}
            </Heading>
            <p className={styles.text}>{item.text}</p>
            <p className={styles.price}>
              <span className={styles.term}>
                {labels.price}
                {item.provisional ? (
                  <span className={styles.tag} data-provisional="">
                    {labels.provisional}
                  </span>
                ) : null}
              </span>
              <span className={styles.value}>
                <span className={styles.unit}>{labels.from}</span>
                <strong>{item.price}</strong>
                <span className={styles.unit}>{labels.unit}</span>
              </span>
            </p>
            <p className={styles.includes}>{labels.includes}</p>
            <ul className={styles.bullets}>
              {item.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <Button href={item.ctaHref} icon={<ArrowIcon />}>
              {item.ctaLabel}
            </Button>
          </Card>
        </li>
      ))}
    </ul>
  );
}
