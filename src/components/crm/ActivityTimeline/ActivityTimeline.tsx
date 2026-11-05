import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { formatDateTime } from "@/lib/crm/contact-detail";
import type { ActivityRow, ActivityTimelineLabels } from "@/types/crm-detail";

import styles from "./ActivityTimeline.module.css";

interface ActivityTimelineProps {
  activities: ActivityRow[];
  authors: Record<string, string>;
  locale: string;
  labels: ActivityTimelineLabels;
}

export function ActivityTimeline({ activities, authors, locale, labels }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return <EmptyState headingLevel={3} title={labels.emptyTitle} text={labels.emptyText} />;
  }
  return (
    <ol className={styles.list} aria-label={labels.listLabel}>
      {activities.map((activity) => {
        const author =
          activity.author_id === null
            ? labels.system
            : (authors[activity.author_id] ?? labels.unknownAuthor);
        return (
          <li key={activity.id} className={styles.item} data-kind={activity.kind}>
            <div className={styles.meta}>
              <span className={styles.kind}>{labels.kinds[activity.kind]}</span>
              <span className={styles.who}>{author}</span>
              <time className={styles.time} dateTime={activity.occurred_at}>
                {formatDateTime(activity.occurred_at, locale)}
              </time>
            </div>
            {activity.body !== null && activity.body !== "" ? (
              <p className={styles.body}>{activity.body}</p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
