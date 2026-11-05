import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import type { CostLine } from "@/types/services";

import styles from "./CostsDisclosure.module.css";

interface CostsDisclosureProps {
  title: string;
  items: CostLine[];
}

export function CostsDisclosure({ title, items }: CostsDisclosureProps) {
  return (
    <Card size="sm" className={styles.costs} data-costs="">
      <Heading level={3} size="h4">
        {title}
      </Heading>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.entry} data-cost={item.id}>
            <strong>{item.label}</strong>
            <span className={styles.text}>{item.text}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
