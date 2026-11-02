"use client";

import { useActiveBlock } from "@/lib/nav/use-active-block";
import type { WayNavItem } from "@/types/services";

import styles from "./WayNav.module.css";

interface WayNavProps {
  label: string;
  items: WayNavItem[];
}

export function WayNav({ label, items }: WayNavProps) {
  const active = useActiveBlock();
  return (
    <nav className={styles.nav} aria-label={label}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={styles.link}
              aria-current={active === item.id ? "location" : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
