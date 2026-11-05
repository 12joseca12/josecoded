"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useId, useState } from "react";

import { barSlots, isCurrentPath } from "@/lib/staff/nav";
import type { StaffNavItem } from "@/types/staff";

import { StaffMoreSheet } from "./StaffMoreSheet";
import styles from "./StaffNav.module.css";

interface StaffNavProps {
  label: string;
  items: StaffNavItem[];
  soonLabel: string;
  moreLabel: string;
  moreTitle: string;
  closeLabel: string;
  sheetFooter: ReactNode;
}

export function StaffNav({
  label,
  items,
  soonLabel,
  moreLabel,
  moreTitle,
  closeLabel,
  sheetFooter,
}: StaffNavProps) {
  const pathname = usePathname();
  const sheetId = useId();
  const [open, setOpen] = useState(false);
  const root = items[0]?.href ?? "";
  const current = items.find((item) => item.ready && isCurrentPath(pathname, item.href, root));
  const barItems = items.filter((item) => item.ready).slice(0, barSlots);
  const moreActive = current !== undefined && !barItems.some((item) => item.key === current.key);

  return (
    <>
      <nav aria-label={label} className={styles.rail}>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.key}>
              {item.ready ? (
                <NextLink
                  href={item.href}
                  className={styles.link}
                  aria-current={current?.key === item.key ? "page" : undefined}
                >
                  {item.label}
                </NextLink>
              ) : (
                <span className={styles.link} data-state="soon">
                  {item.label}
                  <span className={styles.soon}>{soonLabel}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label={label} className={styles.bar}>
        <ul className={styles.barList}>
          {barItems.map((item) => (
            <li key={item.key}>
              <NextLink
                href={item.href}
                className={styles.barItem}
                aria-current={current?.key === item.key ? "page" : undefined}
              >
                {item.label}
              </NextLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              className={styles.barItem}
              aria-haspopup="dialog"
              aria-controls={sheetId}
              data-active={moreActive || undefined}
              onClick={() => {
                setOpen(true);
              }}
            >
              {moreLabel}
            </button>
          </li>
        </ul>
      </nav>
      <StaffMoreSheet
        id={sheetId}
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title={moreTitle}
        closeLabel={closeLabel}
        soonLabel={soonLabel}
        items={items}
        currentKey={current?.key}
        footer={sheetFooter}
      />
    </>
  );
}
