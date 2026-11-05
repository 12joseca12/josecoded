import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import type { ProblemItem, ProblemLabels } from "@/types/how";

import styles from "./ProblemCard.module.css";

interface ProblemCardProps {
  item: ProblemItem;
  labels: ProblemLabels;
}

export function ProblemCard({ item, labels }: ProblemCardProps) {
  const titleId = `problem-${item.id}-title`;
  return (
    <Card as="article" size="lg" className={styles.card} aria-labelledby={titleId}>
      <Heading level={3} size="h4" id={titleId}>
        {item.title}
      </Heading>
      <dl className={styles.steps}>
        <div className={styles.step} data-kind="problem">
          <dt className={styles.label}>{labels.problem}</dt>
          <dd className={styles.text}>{item.problem}</dd>
        </div>
        <div className={styles.step} data-kind="decision">
          <dt className={styles.label}>{labels.decision}</dt>
          <dd className={styles.text}>{item.decision}</dd>
        </div>
        <div className={styles.step} data-kind="result">
          <dt className={styles.label}>{labels.result}</dt>
          <dd className={styles.text}>{item.result}</dd>
        </div>
      </dl>
    </Card>
  );
}
