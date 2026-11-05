import { Heading } from "@/components/ui/Heading/Heading";
import { formatMadridStamp } from "@/lib/settings/madrid-time";
import type { OmenStatusData, OmenStatusLabels, OmenSummary } from "@/types/system";

import styles from "./OmenStatus.module.css";

interface OmenStatusProps {
  summary: OmenSummary;
  data: OmenStatusData | null;
  unavailable: boolean;
  labels: OmenStatusLabels;
  locale: string;
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}

export function OmenStatus({ summary, data, unavailable, labels, locale }: OmenStatusProps) {
  const { tone, ageMinutes } = summary;
  const ago = ageMinutes === null ? "" : fill(labels.minutes, { count: String(ageMinutes) });
  const agoNote = ` (${ago})`;
  const seenAt = data?.seen_at ?? null;
  let band: string | null = null;
  if (unavailable) band = labels.unavailable;
  else if (tone === "none") band = labels.bandNone;
  else if (tone === "down") band = fill(labels.bandDown, { when: ago });
  return (
    <section className={styles.omen} data-tone={tone} aria-labelledby="omen-title">
      <header className={styles.head}>
        <Heading level={2} size="h4" id="omen-title">
          {labels.title}
        </Heading>
        <p className={styles.tone}>
          <span className={styles.dot} aria-hidden="true" />
          {labels.tone[tone]}
        </p>
      </header>
      {band ? <p className={styles.band}>{band}</p> : null}
      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>{labels.seen}</dt>
          <dd>
            {seenAt ? (
              <>
                <time dateTime={seenAt}>{formatMadridStamp(seenAt, locale)}</time>
                {ago ? <span className={styles.muted}>{agoNote}</span> : null}
              </>
            ) : (
              <span className={styles.muted}>{labels.seenNever}</span>
            )}
          </dd>
        </div>
        <div className={styles.fact}>
          <dt>{labels.version}</dt>
          <dd>{data?.version ?? <span className={styles.muted}>{labels.versionNone}</span>}</dd>
        </div>
        <div className={styles.fact}>
          <dt>{labels.models}</dt>
          <dd>
            {data && data.models.length > 0 ? (
              data.models.join(", ")
            ) : (
              <span className={styles.muted}>{labels.modelsNone}</span>
            )}
          </dd>
        </div>
        {(["queued", "running", "failed"] as const).map((name) => (
          <div key={name} className={styles.fact}>
            <dt>{labels.queue[name]}</dt>
            <dd className={styles.count}>{data ? data[name] : "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
