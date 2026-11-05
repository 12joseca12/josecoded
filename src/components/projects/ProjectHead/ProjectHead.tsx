import type { ReactNode } from "react";

import { PageHead } from "@/components/site/PageHead/PageHead";
import type { ProjectStatus } from "@/types/projects";

import { StatusBadge } from "../StatusBadge/StatusBadge";
import styles from "./ProjectHead.module.css";

interface ProjectHeadProps {
  title: string;
  headline: string;
  breadcrumbs: ReactNode;
  kindLabel: string;
  status: ProjectStatus;
  statusLabel: string;
  facts: { label: string; value: string }[];
  links?: ReactNode;
}

export function ProjectHead({
  title,
  headline,
  breadcrumbs,
  kindLabel,
  status,
  statusLabel,
  facts,
  links,
}: ProjectHeadProps) {
  return (
    <PageHead title={title} lead={headline} breadcrumbs={breadcrumbs}>
      <div className={styles.meta}>
        <span className={styles.kind}>{kindLabel}</span>
        <StatusBadge status={status} label={statusLabel} />
      </div>
      <dl className={styles.facts}>
        {facts.map((fact) => (
          <div key={fact.label} className={styles.fact}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      {links}
    </PageHead>
  );
}
