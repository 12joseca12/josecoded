import type { CSSProperties } from "react";

import { Heading } from "@/components/ui/Heading/Heading";
import type { ProjectProgress } from "@/types/area";

import styles from "./ProjectHeader.module.css";

export interface ProjectHeaderLabels {
  phase: string;
  progress: string;
  noTasks: string;
}

interface ProjectHeaderProps {
  name: string;
  offerName: string | null;
  phaseName: string;
  progress: ProjectProgress | null;
  labels: ProjectHeaderLabels;
}

export function ProjectHeader({
  name,
  offerName,
  phaseName,
  progress,
  labels,
}: ProjectHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.title}>
        <Heading level={1} size="h2">
          {name}
        </Heading>
        <p className={styles.meta}>
          {offerName ? <span>{offerName}</span> : null}
          <span>
            {labels.phase} <strong>{phaseName}</strong>
          </span>
        </p>
      </div>
      {progress ? (
        <div className={styles.progress}>
          <div
            className={styles.bar}
            role="progressbar"
            aria-label={labels.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent}
            style={{ "--value": `${progress.percent}%` } as CSSProperties}
          />
          <p className={styles.caption}>
            {progress.total === 0 ? labels.noTasks : `${progress.percent} %`}
          </p>
        </div>
      ) : null}
    </header>
  );
}
