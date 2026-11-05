import type { LeadRow } from "@/types/leads";

import styles from "./LeadStatus.module.css";

interface LeadStatusProps {
  status: LeadRow["status"];
  label: string;
}

export function LeadStatus({ status, label }: LeadStatusProps) {
  return (
    <span className={styles.status} data-status={status}>
      {label}
    </span>
  );
}
