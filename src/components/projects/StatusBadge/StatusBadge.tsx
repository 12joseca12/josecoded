import type { ProjectStatus } from "@/types/projects";

import styles from "./StatusBadge.module.css";

interface StatusBadgeProps {
  status: ProjectStatus;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={styles.badge} data-status={status}>
      {label}
    </span>
  );
}
