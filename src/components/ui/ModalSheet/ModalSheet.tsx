"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

import { Heading } from "../Heading/Heading";
import { IconButton } from "../IconButton/IconButton";
import styles from "./ModalSheet.module.css";

interface ModalSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}

export function ModalSheet({ open, onClose, title, closeLabel, children }: ModalSheetProps) {
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
          <Heading level={2} size="h4" id={titleId}>
            {title}
          </Heading>
          <IconButton label={closeLabel} onClick={onClose}>
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </IconButton>
        </div>
        {children}
      </div>
    </dialog>
  );
}
