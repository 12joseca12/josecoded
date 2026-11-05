import type { TocItem } from "@/types/about";

import styles from "./Toc.module.css";

interface TocProps {
  label: string;
  title: string;
  items: TocItem[];
}

export function Toc({ label, title, items }: TocProps) {
  return (
    <nav className={styles.toc} aria-label={label}>
      <p className={styles.title}>{title}</p>
      <ol className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <a className={styles.link} href={`#${item.id}`}>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
