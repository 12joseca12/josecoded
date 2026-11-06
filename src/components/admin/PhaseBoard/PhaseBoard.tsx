"use client";

import { useState, useTransition } from "react";

import { TaskSheet } from "@/components/admin/TaskSheet/TaskSheet";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import {
  type Assignee,
  type PhaseBoardLabels,
  type TaskHandler,
  type TaskResult,
  type TaskRow,
  type TaskSheetLabels,
} from "@/types/admin-project-detail";
import { type ProjectPhase, projectPhases } from "@/types/admin-projects";

import styles from "./PhaseBoard.module.css";

interface PhaseBoardProps {
  projectId: string;
  tasks: TaskRow[];
  assignees: Assignee[];
  currentPhase: ProjectPhase;
  labels: PhaseBoardLabels;
  sheetLabels: TaskSheetLabels;
  handlers: { save: TaskHandler; remove: TaskHandler; move: TaskHandler };
}

function bySort(a: TaskRow, b: TaskRow): number {
  return a.sort - b.sort;
}

export function PhaseBoard({
  projectId,
  tasks,
  assignees,
  currentPhase,
  labels,
  sheetLabels,
  handlers,
}: PhaseBoardProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const names = new Map(assignees.map((person) => [person.id, person.name]));

  const move = (task: TaskRow, phase: ProjectPhase, sort: number) => {
    if (pending) return;
    setMessage(null);
    startTransition(async () => {
      const result: TaskResult = await handlers.move({ id: task.id, phase, sort });
      setMessage(
        result.status === "error"
          ? { tone: "error", text: labels.errors[result.code] }
          : result.status === "done"
            ? { tone: "success", text: labels.moved.replace("{title}", task.title) }
            : null,
      );
    });
  };

  return (
    <div className={styles.board} aria-busy={pending}>
      <p
        className={styles.message}
        data-tone={message?.tone}
        role={message?.tone === "error" ? "alert" : "status"}
      >
        {pending ? labels.moving : message?.text}
      </p>
      <div className={styles.columns}>
        {projectPhases.map((phase) => {
          const column = tasks.filter((task) => task.phase === phase).sort(bySort);
          return (
            <section
              key={phase}
              className={styles.column}
              data-current={phase === currentPhase ? "true" : undefined}
              aria-labelledby={`phase-${phase}`}
            >
              <header className={styles.columnHead}>
                <h3 className={styles.columnTitle} id={`phase-${phase}`}>
                  {labels.phases[phase]}
                  <span className={styles.count}>{column.length}</span>
                </h3>
                <TaskSheet
                  projectId={projectId}
                  defaultPhase={phase}
                  assignees={assignees}
                  labels={sheetLabels}
                  save={handlers.save}
                  remove={handlers.remove}
                />
              </header>
              {column.length === 0 ? (
                <p className={styles.empty}>{labels.empty}</p>
              ) : (
                <ul className={styles.list}>
                  {column.map((task, index) => (
                    <li key={task.id} className={styles.card} data-status={task.status}>
                      <div className={styles.cardHead}>
                        <p className={styles.title}>{task.title}</p>
                        <StatusPill tone={task.status === "done" ? "done" : "neutral"}>
                          {labels.statuses[task.status]}
                        </StatusPill>
                      </div>
                      <p className={styles.meta}>
                        {task.assignee_id === null
                          ? labels.unassigned
                          : labels.assignedTo.replace(
                              "{name}",
                              names.get(task.assignee_id) ?? labels.unassigned,
                            )}
                      </p>
                      <div className={styles.controls}>
                        <label className={styles.moveLabel}>
                          <span className={styles.moveText}>{labels.moveTo}</span>
                          <select
                            className={styles.select}
                            aria-label={labels.moveToFor.replace("{title}", task.title)}
                            value={task.phase}
                            disabled={pending}
                            onChange={(event) => {
                              const target = event.currentTarget.value as ProjectPhase;
                              move(
                                task,
                                target,
                                tasks.filter((other) => other.phase === target).length,
                              );
                            }}
                          >
                            {projectPhases.map((option) => (
                              <option key={option} value={option}>
                                {labels.phases[option]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          className={styles.step}
                          disabled={pending || index === 0}
                          aria-label={labels.up.replace("{title}", task.title)}
                          onClick={() => {
                            move(task, task.phase, index - 1);
                          }}
                        >
                          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                            <path d="M5 12l5-5 5 5" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={styles.step}
                          disabled={pending || index === column.length - 1}
                          aria-label={labels.down.replace("{title}", task.title)}
                          onClick={() => {
                            move(task, task.phase, index + 1);
                          }}
                        >
                          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                            <path d="M5 8l5 5 5-5" />
                          </svg>
                        </button>
                        <TaskSheet
                          projectId={projectId}
                          task={task}
                          defaultPhase={task.phase}
                          assignees={assignees}
                          labels={sheetLabels}
                          save={handlers.save}
                          remove={handlers.remove}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
