import type { ReactNode } from "react";

import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import type { StoryDetailRow, StoryStatus } from "@/types/area";

import styles from "./StoryCard.module.css";

export interface StoryCardLabels {
  back: string;
  status: Record<StoryStatus, string>;
  asA: string;
  iWant: string;
  soThat: string;
  criteria: string;
  noCriteria: string;
  verdict: string;
  hours: string;
  amount: string;
  note: string;
  decidedOn: string;
  task: string;
  reviewHint: string;
  rejectedHint: string;
  pendingHint: string;
}

interface StoryCardProps {
  story: StoryDetailRow;
  locale: string;
  backHref: string;
  taskHref: string | null;
  labels: StoryCardLabels;
  actions: ReactNode;
}

export function StoryCard({ story, locale, backHref, taskHref, labels, actions }: StoryCardProps) {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Madrid" });
  const decided = story.status !== "proposed";
  return (
    <article className={styles.card}>
      <Link href={backHref}>{labels.back}</Link>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {story.title}
        </Heading>
        <p className={styles.status} data-status={story.status}>
          {labels.status[story.status]}
        </p>
      </header>
      <dl className={styles.text}>
        <div>
          <dt>{labels.asA}</dt>
          <dd>{story.as_a}</dd>
        </div>
        <div>
          <dt>{labels.iWant}</dt>
          <dd>{story.i_want}</dd>
        </div>
        <div>
          <dt>{labels.soThat}</dt>
          <dd>{story.so_that}</dd>
        </div>
      </dl>
      <section className={styles.section} aria-labelledby="story-criteria">
        <Heading level={2} size="h4" id="story-criteria">
          {labels.criteria}
        </Heading>
        {story.criteria.length === 0 ? (
          <p className={styles.muted}>{labels.noCriteria}</p>
        ) : (
          <ul className={styles.criteria}>
            {story.criteria.map((criterion, index) => (
              <li key={`${index}-${criterion}`}>{criterion}</li>
            ))}
          </ul>
        )}
      </section>
      {decided ? (
        <section className={styles.section} aria-labelledby="story-verdict">
          <Heading level={2} size="h4" id="story-verdict">
            {labels.verdict}
          </Heading>
          {story.status === "in_review" ? <p>{labels.reviewHint}</p> : null}
          {story.status === "rejected" ? <p>{labels.rejectedHint}</p> : null}
          <ul className={styles.facts}>
            {story.estimate_hours !== null ? (
              <li>{labels.hours.replace("{hours}", number.format(story.estimate_hours))}</li>
            ) : null}
            {story.estimate_amount !== null ? (
              <li>{labels.amount.replace("{amount}", number.format(story.estimate_amount))}</li>
            ) : null}
            {story.decided_at ? (
              <li>{labels.decidedOn.replace("{date}", date.format(new Date(story.decided_at)))}</li>
            ) : null}
          </ul>
          {story.decision_note ? (
            <p className={styles.note}>
              <span className={styles.noteLabel}>{labels.note}</span> {story.decision_note}
            </p>
          ) : null}
          {taskHref ? <Link href={taskHref}>{labels.task}</Link> : null}
        </section>
      ) : (
        <p className={styles.muted}>{labels.pendingHint}</p>
      )}
      {actions}
    </article>
  );
}
