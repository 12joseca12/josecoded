import { Heading } from "@/components/ui/Heading/Heading";
import type { PointItem } from "@/types/how";

import styles from "./PointList.module.css";

interface PointListProps {
  items: PointItem[];
  label?: string;
}

export function PointList({ items, label }: PointListProps) {
  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className={styles.point}>
          <Heading level={3} size="h4">
            {item.title}
          </Heading>
          <p className={styles.text}>{item.text}</p>
        </li>
      ))}
    </ul>
  );
}
