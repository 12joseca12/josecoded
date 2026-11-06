import { StoryDecisionSheet } from "@/components/admin/StoryDecisionSheet/StoryDecisionSheet";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { formatDay, formatEuro } from "@/lib/admin/users";
import type {
  DecideHandler,
  StoryDecisionLabels,
  StoryListLabels,
  StoryRow,
} from "@/types/admin-project-stories";

import styles from "./StoryList.module.css";

interface StoryCardProps {
  story: StoryRow;
  locale: string;
  labels: StoryListLabels;
  decisionLabels: StoryDecisionLabels;
  decide: DecideHandler;
}

export function StoryCard({ story, locale, labels, decisionLabels, decide }: StoryCardProps) {
  const estimate =
    story.estimate_hours !== null && story.estimate_amount !== null
      ? labels.estimate
          .replace("{hours}", String(story.estimate_hours))
          .replace("{amount}", formatEuro(story.estimate_amount, locale))
      : null;
  return (
    <article className={styles.card} data-status={story.status}>
      <header className={styles.head}>
        <h4 className={styles.title}>{story.title}</h4>
        <div className={styles.pills}>
          {story.out_of_scope ? <StatusPill tone="alert">{labels.outOfScope}</StatusPill> : null}
          <StatusPill tone={story.status === "proposed" ? "alert" : "neutral"}>
            {labels.statuses[story.status]}
          </StatusPill>
        </div>
      </header>
      <dl className={styles.story}>
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
      {story.criteria.length > 0 ? (
        <div className={styles.criteria}>
          <p className={styles.criteriaTitle}>{labels.criteria}</p>
          <ul>
            {story.criteria.map((criterion, index) => (
              <li key={`${index}-${criterion}`}>{criterion}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {story.decided_at !== null || estimate !== null ? (
        <ul className={styles.decision}>
          {estimate !== null ? <li>{estimate}</li> : null}
          {story.decision_note !== null ? (
            <li>{labels.note.replace("{note}", story.decision_note)}</li>
          ) : null}
          {story.decided_at !== null ? (
            <li>{labels.decidedOn.replace("{date}", formatDay(story.decided_at, locale))}</li>
          ) : null}
          {story.confirmed_at !== null ? (
            <li>{labels.confirmedOn.replace("{date}", formatDay(story.confirmed_at, locale))}</li>
          ) : null}
          {story.status === "in_review" ? <li>{labels.awaiting}</li> : null}
          {story.task_id !== null ? <li>{labels.hasTask}</li> : null}
        </ul>
      ) : null}
      {story.status === "proposed" ? (
        <div className={styles.actions}>
          <StoryDecisionSheet story={story} labels={decisionLabels} decide={decide} />
        </div>
      ) : null}
    </article>
  );
}
