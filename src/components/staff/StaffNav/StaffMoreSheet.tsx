"use client";

import NextLink from "next/link";
import { type ReactNode, useEffect, useRef } from "react";

import { IconButton } from "@/components/ui/IconButton/IconButton";
import type { StaffNavItem } from "@/types/staff";

import styles from "./StaffMoreSheet.module.css";

interface StaffMoreSheetProps {
  id: string;
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  soonLabel: string;
  items: StaffNavItem[];
  currentKey: string | undefined;
  footer: ReactNode;
}

export function StaffMoreSheet({
  id,
  open,
  onClose,
  title,
  closeLabel,
  soonLabel,
  items,
  currentKey,
  footer,
}: StaffMoreSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      id={id}
      className={styles.sheet}
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <p className={styles.title} id={`${id}-title`}>
            {title}
          </p>
          <IconButton label={closeLabel} onClick={onClose}>
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </IconButton>
        </div>
        <ul className={styles.links}>
          {items.map((item) => (
            <li key={item.key}>
              {item.ready ? (
                <NextLink
                  href={item.href}
                  className={styles.link}
                  aria-current={currentKey === item.key ? "page" : undefined}
                  onClick={onClose}
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
        <div className={styles.footer}>{footer}</div>
      </div>
    </dialog>
  );
}
