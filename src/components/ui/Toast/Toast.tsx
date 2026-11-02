"use client";

import type { FocusEvent } from "react";

import type { ToastTone } from "@/types/ui";

import styles from "./Toast.module.css";

export interface ToastProps {
  tone: ToastTone;
  title?: string;
  message: string;
  closeLabel: string;
  onClose: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function Toast({
  tone,
  title,
  message,
  closeLabel,
  onClose,
  onPause,
  onResume,
}: ToastProps) {
  const leave = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) onResume();
  };

  return (
    <div
      className={styles.toast}
      data-tone={tone}
      onPointerEnter={onPause}
      onPointerLeave={onResume}
      onFocus={onPause}
      onBlur={leave}
    >
      <div className={styles.body}>
        {title ? <p className={styles.title}>{title}</p> : null}
        <p className={styles.message}>{message}</p>
      </div>
      <button type="button" className={styles.close} aria-label={closeLabel} onClick={onClose}>
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  );
}
