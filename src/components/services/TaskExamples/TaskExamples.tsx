import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import type { TaskExampleItem } from "@/types/services";

import styles from "./TaskExamples.module.css";

interface TaskExamplesProps {
  items: TaskExampleItem[];
  sizeLabel: string;
  deliverableLabel: string;
  note: string;
}

export function TaskExamples({ items, sizeLabel, deliverableLabel, note }: TaskExamplesProps) {
  return (
    <div className={styles.wrap}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.entry}>
            <Card as="article" size="sm" className={styles.card} data-task={item.id}>
              <Heading level={3} size="h4">
                {item.title}
              </Heading>
              <p className={styles.text}>{item.text}</p>
              <dl className={styles.facts}>
                <div className={styles.fact}>
                  <dt>{sizeLabel}</dt>
                  <dd>{item.size}</dd>
                </div>
                <div className={styles.fact}>
                  <dt>{deliverableLabel}</dt>
                  <dd>{item.deliverable}</dd>
                </div>
              </dl>
            </Card>
          </li>
        ))}
      </ul>
      <p className={styles.note}>{note}</p>
    </div>
  );
}
