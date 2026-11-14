import type { ProjectCardProps } from "@/components/projects/ProjectCard/ProjectCard";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";

import styles from "./ShowcaseProjectCard.module.css";

type ShowcaseProjectCardProps = Pick<
  ProjectCardProps,
  "title" | "href" | "kindLabel" | "status" | "statusLabel" | "headline" | "metric" | "viewLabel"
>;

export function ShowcaseProjectCard({
  title,
  href,
  kindLabel,
  status,
  statusLabel,
  headline,
  metric,
  viewLabel,
}: ShowcaseProjectCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.meta}>
        <span className={styles.chip}>{kindLabel}</span>
        <span className={styles.chip} data-status={status}>
          {statusLabel}
        </span>
      </div>
      <Heading level={3} size="h4">
        {title}
      </Heading>
      <p className={styles.headline}>{headline}</p>
      {metric ? (
        <p className={styles.metric}>
          <strong>{metric.value}</strong> {metric.label}
          <small>{metric.source}</small>
        </p>
      ) : null}
      <Link href={href} variant="arrow">
        {viewLabel}
        <VisuallyHidden> {title}</VisuallyHidden>
      </Link>
    </article>
  );
}
