import NextLink from "next/link";

import type { StoryListRow, StoryStatus } from "@/types/area";

import styles from "./StoryList.module.css";

export interface StoryListLabels {
  list: string;
  status: Record<StoryStatus, string>;
  created: string;
  estimate: string;
}

interface StoryListProps {
  stories: StoryListRow[];
  locale: string;
  href: (id: string) => string;
  labels: StoryListLabels;
}

export function StoryList({ stories, locale, href, labels }: StoryListProps) {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Europe/Madrid" });
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return (
    <ul className={styles.list} aria-label={labels.list}>
      {stories.map((story) => (
        <li key={story.id} className={styles.item} data-status={story.status}>
          <NextLink href={href(story.id)} className={styles.title}>
            {story.title}
          </NextLink>
          <p className={styles.meta}>
            <span className={styles.status}>{labels.status[story.status]}</span>
            <span>{labels.created.replace("{date}", date.format(new Date(story.created_at)))}</span>
            {story.estimate_hours !== null && story.estimate_amount !== null ? (
              <span>
                {labels.estimate
                  .replace("{hours}", number.format(story.estimate_hours))
                  .replace("{amount}", number.format(story.estimate_amount))}
              </span>
            ) : null}
          </p>
        </li>
      ))}
    </ul>
  );
}
