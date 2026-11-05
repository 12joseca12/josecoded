import type { TermItem } from "@/types/services";

import styles from "./TermsStrip.module.css";

interface TermsStripProps {
  labelledBy: string;
  items: TermItem[];
}

export function TermsStrip({ labelledBy, items }: TermsStripProps) {
  return (
    <dl className={styles.strip} aria-labelledby={labelledBy}>
      {items.map((item) => (
        <div key={item.id} className={styles.term} data-term={item.id}>
          <dt className={styles.title}>{item.title}</dt>
          <dd className={styles.text}>{item.text}</dd>
        </div>
      ))}
    </dl>
  );
}
