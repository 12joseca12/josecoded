"use client";

import NextLink from "next/link";

import { useActiveBlock } from "@/lib/nav/use-active-block";
import type { WayNavId, WayNavItem, WayNavVariant } from "@/types/services";

import styles from "./WayNav.module.css";

interface WayNavProps {
  label: string;
  items: WayNavItem[];
  variant?: WayNavVariant;
  current?: WayNavId;
}

export function WayNav({ label, items, variant = "anchors", current }: WayNavProps) {
  const active = useActiveBlock();
  return (
    <nav className={styles.nav} aria-label={label}>
      <ul className={styles.list} data-snap="x">
        {items.map((item) => {
          const ariaCurrent =
            variant === "pages"
              ? item.id === current
                ? "page"
                : undefined
              : active === item.id
                ? "location"
                : undefined;
          return (
            <li key={item.id}>
              {variant === "pages" ? (
                <NextLink href={item.href} className={styles.link} aria-current={ariaCurrent}>
                  {item.label}
                </NextLink>
              ) : (
                <a href={item.href} className={styles.link} aria-current={ariaCurrent}>
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
