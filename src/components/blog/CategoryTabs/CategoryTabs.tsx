import NextLink from "next/link";

import type { CategoryTabItem } from "@/types/blog";

import styles from "./CategoryTabs.module.css";

interface CategoryTabsProps {
  label: string;
  items: CategoryTabItem[];
}

export function CategoryTabs({ label, items }: CategoryTabsProps) {
  return (
    <nav aria-label={label}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <NextLink
              href={item.href}
              className={styles.tab}
              aria-current={item.current ? "page" : undefined}
            >
              {item.label}
            </NextLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
