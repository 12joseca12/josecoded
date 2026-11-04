"use client";

import NextLink from "next/link";
import { type ReactNode, useEffect, useRef } from "react";

import { IconButton } from "@/components/ui/IconButton/IconButton";
import type { NavLink } from "@/types/nav";

import styles from "./MobileMenu.module.css";

interface MobileMenuProps {
  id: string;
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  hereLabel: string;
  links: NavLink[];
  cta: ReactNode;
}

export function MobileMenu({
  id,
  open,
  onClose,
  title,
  closeLabel,
  hereLabel,
  links,
  cta,
}: MobileMenuProps) {
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
          {links.map((link, index) => (
            <li key={link.key}>
              <NextLink
                href={link.href}
                className={styles.link}
                aria-current={link.current}
                data-active={link.active || undefined}
                onClick={onClose}
              >
                <span className={styles.num}>{String(index).padStart(2, "0")}</span>
                <span>{link.label}</span>
                <span className={styles.here}>{hereLabel}</span>
              </NextLink>
            </li>
          ))}
        </ul>
        <div className={styles.cta}>{cta}</div>
      </div>
    </dialog>
  );
}
