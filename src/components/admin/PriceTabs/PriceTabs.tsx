import NextLink from "next/link";

import styles from "./PriceTabs.module.css";

export interface PriceTabItem {
  id: string;
  label: string;
  href: string;
}

interface PriceTabsProps {
  label: string;
  items: PriceTabItem[];
  currentId: string;
}

export function PriceTabs({ label, items, currentId }: PriceTabsProps) {
  return (
    <nav aria-label={label}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <NextLink
              href={item.href}
              className={styles.tab}
              aria-current={item.id === currentId ? "page" : undefined}
            >
              {item.label}
            </NextLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
