"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import { formatCountdown, type NexoBarLabels } from "@/lib/chat/nexo-bar";

import styles from "./NexoBar.module.css";

export interface NexoBarProps {
  labels: NexoBarLabels;
  dueAt?: string | null;
  onStop: () => void;
  stopping?: boolean;
  stopped?: boolean;
}

function useNow(active: boolean): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      setNow(Date.now());
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [active]);
  return now;
}

export function NexoBar({
  labels,
  dueAt = null,
  onStop,
  stopping = false,
  stopped = false,
}: NexoBarProps) {
  const counting = !stopped && dueAt !== null;
  const now = useNow(counting);
  const phase = stopped ? "stopped" : stopping ? "stopping" : "active";
  const title = stopped ? labels.stoppedTitle : labels.activeTitle;

  return (
    <div className={styles.bar} role="group" data-phase={phase} aria-label={labels.region}>
      <span className={styles.tag}>{labels.tag}</span>
      <div className={styles.text}>
        <p className={styles.title} role="status">
          {title}
          <VisuallyHidden>
            {stopped ? labels.stoppedText : labels.activeAnnouncement}
          </VisuallyHidden>
        </p>
        {stopped ? (
          <p className={styles.detail} aria-hidden="true">
            {labels.stoppedText}
          </p>
        ) : counting ? (
          <p className={styles.detail} aria-hidden="true">
            {labels.remaining}{" "}
            <span className={styles.time} data-testid="nexo-bar-time">
              {now === null ? "--:--" : formatCountdown(dueAt, now)}
            </span>
          </p>
        ) : null}
      </div>
      {stopped ? null : (
        <Button
          variant="light"
          size="sm"
          loading={stopping}
          loadingLabel={labels.stopping}
          onClick={onStop}
        >
          {labels.stop}
        </Button>
      )}
    </div>
  );
}
