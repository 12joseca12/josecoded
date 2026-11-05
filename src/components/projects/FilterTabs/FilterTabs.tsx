import NextLink from "next/link";

import styles from "./FilterTabs.module.css";

interface FilterTabsProps {
  label: string;
  items: { id: string; label: string; href: string; active: boolean }[];
}

export function FilterTabs({ label, items }: FilterTabsProps) {
  return (
    <nav aria-label={label}>
      <ul className={styles.tabs}>
        {items.map((item) => (
          <li key={item.id}>
            <NextLink
              href={item.href}
              className={styles.tab}
              aria-current={item.active ? "page" : undefined}
              scroll={false}
            >
              {item.label}
            </NextLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
