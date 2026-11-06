import type { ConsentBadgeLabels, ConsentState } from "@/types/room";

import styles from "./ConsentBadge.module.css";

interface ConsentBadgeProps {
  state: ConsentState;
  labels: ConsentBadgeLabels;
}

export function ConsentBadge({ state, labels }: ConsentBadgeProps) {
  if (state === "n/a") return null;
  return (
    <p className={styles.badge} data-state={state}>
      <span className={styles.label}>{labels.label}</span>
      <span className={styles.value}>{labels.states[state]}</span>
    </p>
  );
}
