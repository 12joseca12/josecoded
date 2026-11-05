"use client";

import { useState } from "react";

import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import {
  idleEvents,
  type NotificationChannel,
  notificationChannels,
  type NotificationEvent,
  type PrefHandler,
  type PrefMatrix,
  type RuleMatrixLabels,
} from "@/types/notifications";

import styles from "./RuleMatrix.module.css";

interface RuleMatrixProps {
  matrix: PrefMatrix;
  events: readonly NotificationEvent[];
  labels: RuleMatrixLabels;
  save: PrefHandler;
}

type Feedback = { tone: "success" | "error"; text: string } | null;

function cellKey(event: NotificationEvent, channel: NotificationChannel): string {
  return `${event}:${channel}`;
}

export function RuleMatrix({ matrix, events, labels, save }: RuleMatrixProps) {
  const [values, setValues] = useState(matrix);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [feedback, setFeedback] = useState<Feedback>(null);

  const toggle = async (
    event: NotificationEvent,
    channel: NotificationChannel,
    enabled: boolean,
  ) => {
    const key = cellKey(event, channel);
    if (pending.has(key)) return;
    const name = `${labels.events[event]} · ${labels.channels[channel]}`;
    setFeedback(null);
    setPending((current) => new Set(current).add(key));
    setValues((current) => ({ ...current, [event]: { ...current[event], [channel]: enabled } }));
    const result = await save({ event, channel, enabled });
    if (result.status === "done") {
      setFeedback({ tone: "success", text: `${name}: ${labels.saved}` });
    } else {
      setValues((current) => ({
        ...current,
        [event]: { ...current[event], [channel]: !enabled },
      }));
      setFeedback({ tone: "error", text: `${name}: ${labels.errors[result.status]}` });
    }
    setPending((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  };

  return (
    <div className={styles.matrix} role="region" aria-label={labels.region}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <caption>
            <VisuallyHidden>{labels.caption}</VisuallyHidden>
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles.eventHead}>
                {labels.event}
              </th>
              {notificationChannels.map((channel) => (
                <th key={channel} scope="col" className={styles.channelHead}>
                  {labels.channels[channel]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event} className={styles.row}>
                <th scope="row" className={styles.eventName}>
                  <div className={styles.eventBody}>
                    <span>{labels.events[event]}</span>
                    {idleEvents.includes(event) ? (
                      <span className={styles.idle}>{labels.idle}</span>
                    ) : null}
                  </div>
                </th>
                {notificationChannels.map((channel) => {
                  const busy = pending.has(cellKey(event, channel));
                  return (
                    <td key={channel} className={styles.cell}>
                      <label className={styles.switch} data-busy={busy ? "true" : undefined}>
                        <input
                          type="checkbox"
                          role="switch"
                          className={styles.input}
                          checked={values[event][channel]}
                          disabled={busy}
                          aria-label={`${labels.events[event]}: ${labels.channels[channel]}`}
                          onChange={(change) => {
                            void toggle(event, channel, change.currentTarget.checked);
                          }}
                        />
                        <span className={styles.track} aria-hidden="true">
                          <span className={styles.thumb} />
                        </span>
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>{labels.telegramNote}</p>
      <p className={styles.feedback} data-tone="success" role="status">
        {feedback?.tone === "success" ? feedback.text : null}
      </p>
      <p className={styles.feedback} data-tone="error" role="alert">
        {feedback?.tone === "error" ? feedback.text : null}
      </p>
    </div>
  );
}
