import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import { type ProjectPhase, projectPhases } from "@/types/area";

import styles from "./PhaseSteps.module.css";

export interface PhaseStepsLabels {
  list: string;
  phases: Record<ProjectPhase, string>;
  state: { done: string; current: string; next: string };
}

interface PhaseStepsProps {
  current: ProjectPhase;
  labels: PhaseStepsLabels;
}

export function PhaseSteps({ current, labels }: PhaseStepsProps) {
  const position = projectPhases.indexOf(current);
  return (
    <ol className={styles.steps} aria-label={labels.list}>
      {projectPhases.map((phase, index) => {
        const state = index < position ? "done" : index === position ? "current" : "next";
        return (
          <li
            key={phase}
            className={styles.step}
            data-state={state}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className={styles.marker} aria-hidden="true">
              {index + 1}
            </span>
            <span className={styles.name}>{labels.phases[phase]}</span>
            <VisuallyHidden>{labels.state[state]}</VisuallyHidden>
          </li>
        );
      })}
    </ol>
  );
}
