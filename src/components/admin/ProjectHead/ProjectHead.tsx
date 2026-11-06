"use client";

import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import type { ProjectHeadLabels, TaskHandler } from "@/types/admin-project-detail";
import { type ProjectPhase, projectPhases, type ProjectRow } from "@/types/admin-projects";

import styles from "./ProjectHead.module.css";

interface ProjectHeadProps {
  project: ProjectRow;
  labels: ProjectHeadLabels;
  setPhase: TaskHandler;
  archive: TaskHandler;
}

type Message = { tone: "success" | "error"; text: string } | null;

export function ProjectHead({ project, labels, setPhase, archive }: ProjectHeadProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);
  const [confirming, setConfirming] = useState(false);
  const archived = project.archived_at !== null;
  const phaseId = useId();

  const run = (call: () => ReturnType<TaskHandler>, success: string) => {
    if (pending) return;
    setMessage(null);
    startTransition(async () => {
      const result = await call();
      if (result.status === "done") setMessage({ tone: "success", text: success });
      else if (result.status === "error") {
        setMessage({ tone: "error", text: labels.errors[result.code] });
      }
      setConfirming(false);
    });
  };

  return (
    <section className={styles.head} aria-busy={pending}>
      <div className={styles.row}>
        <StatusPill tone={project.status === "closed" ? "muted" : "neutral"}>
          {labels.statuses[project.status]}
        </StatusPill>
        <div className={styles.progress}>
          <progress
            className={styles.bar}
            value={project.percent}
            max={100}
            aria-label={labels.progress}
          />
          <span className={styles.meta}>
            {labels.progressText
              .replace("{done}", String(project.done))
              .replace("{total}", String(project.total))
              .replace("{percent}", String(project.percent))}
          </span>
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.phase}>
          <label className={styles.label} htmlFor={phaseId}>
            {labels.phase}
          </label>
          <select
            id={phaseId}
            className={styles.select}
            value={project.phase}
            disabled={pending || archived}
            onChange={(event) => {
              const phase = event.currentTarget.value as ProjectPhase;
              run(() => setPhase({ id: project.id, phase }), labels.phaseSaved);
            }}
          >
            {projectPhases.map((phase) => (
              <option key={phase} value={phase}>
                {labels.phases[phase]}
              </option>
            ))}
          </select>
        </div>
        {archived ? (
          <Button
            variant="light"
            loading={pending}
            loadingLabel={labels.working}
            onClick={() => {
              run(() => archive({ id: project.id, archived: false }), labels.restored);
            }}
          >
            {labels.restore}
          </Button>
        ) : confirming ? (
          <div className={styles.confirm} role="group" aria-label={labels.archive}>
            <p className={styles.meta}>{labels.archiveConfirm}</p>
            <Button
              variant="light"
              loading={pending}
              loadingLabel={labels.working}
              onClick={() => {
                run(() => archive({ id: project.id, archived: true }), labels.archived);
              }}
            >
              {labels.archive}
            </Button>
            <Button
              variant="quiet"
              disabled={pending}
              onClick={() => {
                setConfirming(false);
              }}
            >
              {labels.cancel}
            </Button>
          </div>
        ) : (
          <Button
            variant="quiet"
            disabled={pending}
            onClick={() => {
              setConfirming(true);
            }}
          >
            {labels.archive}
          </Button>
        )}
      </div>
      <p
        className={styles.message}
        data-tone={message?.tone}
        role={message?.tone === "error" ? "alert" : "status"}
      >
        {message?.text}
      </p>
    </section>
  );
}
