import Link from "next/link";

import type { FilterTabItem } from "@/types/filters";

import styles from "./FilterTabs.module.css";

interface FilterTabsProps {
  label: string;
  items: FilterTabItem[];
}

export function FilterTabs({ label, items }: FilterTabsProps) {
  return (
    <nav aria-label={label}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.key}>
            <Link
              className={styles.tab}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              scroll={false}
            >
              {item.label}
              <span className={styles.count}>{item.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
