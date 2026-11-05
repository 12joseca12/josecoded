import { Heading } from "@/components/ui/Heading/Heading";
import type { RecentUpdate, StoryStatus } from "@/types/area";

import styles from "./RecentUpdates.module.css";

export interface RecentUpdatesLabels {
  title: string;
  empty: string;
  task: string;
  document: string;
  story: Record<StoryStatus, string>;
}

interface RecentUpdatesProps {
  updates: RecentUpdate[];
  locale: string;
  labels: RecentUpdatesLabels;
}

function describe(update: RecentUpdate, labels: RecentUpdatesLabels): string {
  if (update.kind === "task") return labels.task;
  if (update.kind === "document") return labels.document;
  return update.status ? labels.story[update.status] : "";
}

export function RecentUpdates({ updates, locale, labels }: RecentUpdatesProps) {
  const format = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "Europe/Madrid",
  });
  return (
    <section className={styles.section} aria-labelledby="area-recent">
      <Heading level={2} size="h4" id="area-recent">
        {labels.title}
      </Heading>
      {updates.length === 0 ? (
        <p className={styles.empty}>{labels.empty}</p>
      ) : (
        <ul className={styles.list}>
          {updates.map((update) => (
            <li key={update.key} className={styles.item} data-kind={update.kind}>
              <span className={styles.kind}>{describe(update, labels)}</span>
              <span className={styles.title}>{update.title}</span>
              <time className={styles.time} dateTime={update.at}>
                {format.format(new Date(update.at))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
