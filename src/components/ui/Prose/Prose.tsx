import type { ReactNode } from "react";

import styles from "./Prose.module.css";

export interface ProseProps {
  children: ReactNode;
}

export function Prose({ children }: ProseProps) {
  return <div className={styles.prose}>{children}</div>;
}
