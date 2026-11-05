import { Heading } from "@/components/ui/Heading/Heading";
import type { TimelineRow } from "@/types/about";

import styles from "./Timeline.module.css";

interface TimelineProps {
  label: string;
  entries: TimelineRow[];
}

export function Timeline({ label, entries }: TimelineProps) {
  return (
    <ol className={styles.timeline} aria-label={label}>
      {entries.map((entry) => (
        <li key={entry.title} className={styles.entry}>
          {entry.period ? <span className={styles.period}>{entry.period}</span> : <span />}
          <div className={styles.body}>
            <Heading level={3} size="h4">
              {entry.title}
            </Heading>
            {entry.organization ? (
              <p className={styles.organization}>{entry.organization}</p>
            ) : null}
            {entry.summary ? <p className={styles.summary}>{entry.summary}</p> : null}
            {entry.highlights.length > 0 ? (
              <ul className={styles.highlights}>
                {entry.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
