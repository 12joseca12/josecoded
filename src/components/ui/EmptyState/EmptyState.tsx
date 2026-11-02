import type { ReactNode } from "react";

import type { HeadingLevel } from "@/types/ui";

import { Heading } from "../Heading/Heading";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  title: string;
  text: string;
  icon?: ReactNode;
  action?: ReactNode;
  headingLevel?: HeadingLevel;
}

export function EmptyState({ title, text, icon, action, headingLevel = 3 }: EmptyStateProps) {
  return (
    <div className={styles.state}>
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <Heading level={headingLevel} size="h4">
        {title}
      </Heading>
      <p className={styles.text}>{text}</p>
      {action}
    </div>
  );
}
