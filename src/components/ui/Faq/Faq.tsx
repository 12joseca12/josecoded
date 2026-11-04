import type { FaqItem } from "@/types/services";

import { ChevronIcon } from "../icons/ChevronIcon";
import styles from "./Faq.module.css";

interface FaqProps {
  items: FaqItem[];
}

export function Faq({ items }: FaqProps) {
  return (
    <div className={styles.faq}>
      {items.map((item) => (
        <details key={item.id} className={styles.item}>
          <summary className={styles.question}>
            <span>{item.question}</span>
            <span className={styles.icon}>
              <ChevronIcon />
            </span>
          </summary>
          <p className={styles.answer}>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
