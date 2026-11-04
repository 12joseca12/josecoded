import { Heading } from "@/components/ui/Heading/Heading";
import type { StepItem } from "@/types/services";

import styles from "./Steps.module.css";

interface StepsProps {
  items: StepItem[];
  label?: string;
}

export function Steps({ items, label }: StepsProps) {
  return (
    <ol className={styles.steps} aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className={styles.step}>
          <Heading level={3} size="h4">
            {item.title}
          </Heading>
          <p className={styles.text}>{item.text}</p>
        </li>
      ))}
    </ol>
  );
}
