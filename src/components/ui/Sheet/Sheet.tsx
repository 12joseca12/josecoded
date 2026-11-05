"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

import { IconButton } from "@/components/ui/IconButton/IconButton";

import styles from "./Sheet.module.css";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, closeLabel, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
          <IconButton label={closeLabel} onClick={onClose}>
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </IconButton>
        </div>
        {open ? <div className={styles.body}>{children}</div> : null}
      </div>
    </dialog>
  );
}
