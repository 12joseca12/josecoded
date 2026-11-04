"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

import styles from "./AdminNav.module.css";

export interface AdminNavItem {
  href: string;
  label: string;
}

interface AdminNavProps {
  label: string;
  items: AdminNavItem[];
}

function isCurrent(pathname: string, href: string, root: string): boolean {
  if (href === root) return pathname === root;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ label, items }: AdminNavProps) {
  const pathname = usePathname();
  const root = items[0]?.href ?? "";
  return (
    <nav aria-label={label} className={styles.nav}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.href}>
            <NextLink
              href={item.href}
              className={styles.link}
              aria-current={isCurrent(pathname, item.href, root) ? "page" : undefined}
            >
              {item.label}
            </NextLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
