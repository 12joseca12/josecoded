import { StackChips } from "@/components/services/StackChips/StackChips";
import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import type { ProjectStatus } from "@/types/projects";

import { StatusBadge } from "../StatusBadge/StatusBadge";
import styles from "./ProjectCard.module.css";

interface ProjectCardProps {
  title: string;
  href: string;
  kindLabel: string;
  status: ProjectStatus;
  statusLabel: string;
  headline: string;
  roleLabel: string;
  role: string;
  period: string;
  stack: string[];
  metric?: { label: string; value: string; source: string };
  viewLabel: string;
}

export function ProjectCard({
  title,
  href,
  kindLabel,
  status,
  statusLabel,
  headline,
  roleLabel,
  role,
  period,
  stack,
  metric,
  viewLabel,
}: ProjectCardProps) {
  return (
    <Card as="article" size="lg" className={styles.card}>
      <div className={styles.meta}>
        <span className={styles.kind}>{kindLabel}</span>
        <StatusBadge status={status} label={statusLabel} />
      </div>
      <Heading level={2} size="h3">
        {title}
      </Heading>
      <p className={styles.headline}>{headline}</p>
      <p className={styles.role}>
        <strong>{roleLabel}</strong> {role}
        <span className={styles.period}>{period}</span>
      </p>
      {metric ? (
        <p className={styles.metric}>
          <strong>{metric.value}</strong> {metric.label}
          <span className={styles.source}>{metric.source}</span>
        </p>
      ) : null}
      <StackChips items={stack} />
      <Link href={href} variant="arrow">
        {viewLabel}
        <VisuallyHidden> {title}</VisuallyHidden>
      </Link>
    </Card>
  );
}
