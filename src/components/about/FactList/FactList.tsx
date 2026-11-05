import { Heading } from "@/components/ui/Heading/Heading";
import type { FactItem, FactListVariant } from "@/types/about";

import styles from "./FactList.module.css";

interface FactListProps {
  items: FactItem[];
  variant?: FactListVariant;
}

export function FactList({ items, variant = "plain" }: FactListProps) {
  const Tag = variant === "numbered" ? "ol" : "ul";
  return (
    <Tag className={styles.list} data-variant={variant}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <Heading level={3} size="h4">
            {item.title}
          </Heading>
          <p className={styles.text}>{item.text}</p>
        </li>
      ))}
    </Tag>
  );
}
