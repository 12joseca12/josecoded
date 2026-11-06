import NextLink from "next/link";
import type { CSSProperties } from "react";

import { Heading } from "@/components/ui/Heading/Heading";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import type { ProjectPhase, ProjectStatus } from "@/types/area";
import type { FreelanceProject } from "@/types/freelance";

import styles from "./ProjectList.module.css";

export interface ProjectListLabels {
  phase: string;
  phases: Record<ProjectPhase, string>;
  status: Record<ProjectStatus, string>;
  progress: string;
  noTasks: string;
  tasksDone: string;
  due: string;
  closed: string;
}

interface ProjectListProps {
  projects: FreelanceProject[];
  locale: string;
  labels: ProjectListLabels;
  hrefFor: (id: string) => string;
  feeLines?: Record<string, string>;
  headingLevel?: 2 | 3;
}

function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function ProjectList({
  projects,
  locale,
  labels,
  hrefFor,
  feeLines,
  headingLevel = 2,
}: ProjectListProps) {
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  return (
    <ul className={styles.list}>
      {projects.map((project) => {
        const closed = project.archived_at !== null || project.status === "closed";
        return (
          <li key={project.id} className={styles.item} data-closed={closed || undefined}>
            <div className={styles.head}>
              <Heading level={headingLevel} size="h4">
                <NextLink className={styles.link} href={hrefFor(project.id)}>
                  {project.name}
                </NextLink>
              </Heading>
              <StatusPill
                tone={closed ? "muted" : project.status === "paused" ? "alert" : "neutral"}
              >
                {closed ? labels.closed : labels.status[project.status]}
              </StatusPill>
            </div>
            <p className={styles.meta}>
              <span>
                {labels.phase} <strong>{labels.phases[project.phase]}</strong>
              </span>
              {project.due_at ? (
                <span>{fill(labels.due, { date: format.format(new Date(project.due_at)) })}</span>
              ) : null}
            </p>
            {feeLines?.[project.id] ? <p className={styles.fee}>{feeLines[project.id]}</p> : null}
            <div
              className={styles.bar}
              role="progressbar"
              aria-label={fill(labels.progress, { name: project.name })}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={project.percent}
              style={{ "--value": `${project.percent}%` } as CSSProperties}
            />
            <p className={styles.caption}>
              {project.total === 0
                ? labels.noTasks
                : fill(labels.tasksDone, { done: project.done, total: project.total })}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
