import type { ReactNode } from "react";

import type { TeamPanelLabels } from "@/types/admin-project-fee";

import styles from "./TeamPanel.module.css";

interface TeamPanelProps {
  clientName: string | null;
  freelanceName: string | null;
  labels: TeamPanelLabels;
  children: ReactNode;
}

export function TeamPanel({ clientName, freelanceName, labels, children }: TeamPanelProps) {
  return (
    <div className={styles.team}>
      <dl className={styles.members} aria-label={labels.title}>
        <div className={styles.member}>
          <dt className={styles.role}>{labels.client}</dt>
          <dd className={styles.name}>{clientName ?? labels.clientNone}</dd>
        </div>
        <div className={styles.member}>
          <dt className={styles.role}>{labels.freelance}</dt>
          <dd className={styles.name}>{freelanceName ?? labels.freelanceNone}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}
