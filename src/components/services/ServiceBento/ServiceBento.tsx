import type { ReactNode } from "react";

import styles from "./ServiceBento.module.css";

interface ServiceBentoProps {
  children: ReactNode;
}

export function ServiceBento({ children }: ServiceBentoProps) {
  return (
    <div className={styles.bento}>
      <div className={styles.grid}>{children}</div>
    </div>
  );
}
