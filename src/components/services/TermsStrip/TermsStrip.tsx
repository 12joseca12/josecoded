import type { TermItem } from "@/types/services";

import styles from "./TermsStrip.module.css";

interface TermsStripProps {
  label: string;
  items: TermItem[];
}

export function TermsStrip({ label, items }: TermsStripProps) {
  return (
    <dl className={styles.strip} aria-label={label}>
      {items.map((item) => (
        <div key={item.id} className={styles.term} data-term={item.id}>
          <dt className={styles.title}>{item.title}</dt>
          <dd className={styles.text} data-pending={item.pending ? "" : undefined}>
            {item.text}
          </dd>
        </div>
      ))}
    </dl>
  );
}
