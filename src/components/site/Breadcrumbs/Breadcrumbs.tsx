import NextLink from "next/link";

import type { BreadcrumbItem } from "@/types/services";

import styles from "./Breadcrumbs.module.css";

interface BreadcrumbsProps {
  label: string;
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ label, items }: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className={styles.crumbs}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.label} className={styles.item}>
              {item.href && !last ? (
                <NextLink href={item.href} className={styles.link}>
                  {item.label}
                </NextLink>
              ) : (
                <span aria-current={last ? "page" : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
