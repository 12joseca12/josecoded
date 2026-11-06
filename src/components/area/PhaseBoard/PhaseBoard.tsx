import { Heading } from "@/components/ui/Heading/Heading";
import { type BoardTask, type ProjectPhase, projectPhases } from "@/types/area";

import { TaskRow, type TaskRowLabels } from "../TaskRow/TaskRow";
import styles from "./PhaseBoard.module.css";

export interface PhaseBoardLabels {
  board: string;
  phases: Record<ProjectPhase, string>;
  emptyPhase: string;
  row: TaskRowLabels;
}

interface PhaseBoardProps {
  groups: Record<ProjectPhase, BoardTask[]>;
  current: ProjectPhase;
  taskHref: (id: string) => string;
  storyHref: (id: string) => string;
  labels: PhaseBoardLabels;
}

export function PhaseBoard({ groups, current, taskHref, storyHref, labels }: PhaseBoardProps) {
  return (
    <div className={styles.board} role="group" aria-label={labels.board}>
      {projectPhases.map((phase) => (
        <section
          key={phase}
          className={styles.column}
          data-current={phase === current || undefined}
          aria-labelledby={`phase-${phase}`}
        >
          <Heading level={2} size="h4" id={`phase-${phase}`}>
            {labels.phases[phase]}
          </Heading>
          {groups[phase].length === 0 ? (
            <p className={styles.empty}>{labels.emptyPhase}</p>
          ) : (
            <ul className={styles.list}>
              {groups[phase].map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  href={taskHref(task.id)}
                  storyHref={task.story ? storyHref(task.story.id) : ""}
                  mine={task.assigned_to_me}
                  labels={labels.row}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
