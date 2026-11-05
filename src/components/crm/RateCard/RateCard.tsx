import { Heading } from "@/components/ui/Heading/Heading";
import { formatRate, type MyRates } from "@/lib/crm/rates";

import styles from "./RateCard.module.css";

export interface RateCardLabels {
  title: string;
  text: string;
  project: string;
  recurring: string;
  percent: string;
  none: string;
}

interface RateCardProps {
  rates: MyRates;
  labels: RateCardLabels;
  locale: string;
}

export function RateCard({ rates, labels, locale }: RateCardProps) {
  const entries = [
    { key: "project", name: labels.project, value: rates.project },
    { key: "recurring", name: labels.recurring, value: rates.recurring },
  ].filter((entry) => entry.value !== null);

  return (
    <section className={styles.card} aria-labelledby="rate-title">
      <Heading level={2} size="h4" id="rate-title">
        {labels.title}
      </Heading>
      <p className={styles.text}>{labels.text}</p>
      {entries.length === 0 ? (
        <p className={styles.none}>{labels.none}</p>
      ) : (
        <dl className={styles.list}>
          {entries.map((entry) => (
            <div key={entry.key} className={styles.item}>
              <dt>{entry.name}</dt>
              <dd className={styles.value}>
                {labels.percent.replace("{value}", formatRate(entry.value ?? 0, locale))}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
