import type { ReactNode } from "react";

import styles from "./StatusPill.module.css";

export const statusPillTones = ["neutral", "done", "alert", "muted"] as const;
export type StatusPillTone = (typeof statusPillTones)[number];

interface StatusPillProps {
  tone?: StatusPillTone;
  children: ReactNode;
}

export function StatusPill({ tone = "neutral", children }: StatusPillProps) {
  return (
    <span className={styles.pill} data-tone={tone}>
      {children}
    </span>
  );
}
