"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import {
  defaultWindowMs,
  describeApproximate,
  formatCountdown,
  type NexoBarKind,
  type NexoBarLabels,
  remainingFraction,
} from "@/lib/chat/nexo-bar";

import styles from "./NexoBar.module.css";

export type NexoBarState =
  | { kind: "waiting" }
  | { kind: "countdown"; dueAt: string }
  | { kind: "active" }
  | { kind: "stopped" };

export interface NexoBarProps {
  labels: NexoBarLabels;
  state: NexoBarState;
  onStop: () => void;
  onResume: () => void;
  busy?: boolean;
  windowMs?: number;
}

interface Tick {
  dueAt: string;
  at: number;
}

function useNow(dueAt: string | null): number | null {
  const [tick, setTick] = useState<Tick | null>(null);
  useEffect(() => {
    if (dueAt === null) return;
    const due = Date.parse(dueAt);
    if (Number.isNaN(due)) return;
    const timer = setInterval(update, 1000);
    function update() {
      const at = Date.now();
      setTick({ dueAt: dueAt ?? "", at });
      if (at >= due) clearInterval(timer);
    }
    update();
    return () => {
      clearInterval(timer);
    };
  }, [dueAt]);
  return tick !== null && tick.dueAt === dueAt ? tick.at : null;
}

function Mark({ stopped }: { stopped: boolean }) {
  return (
    <svg className={styles.mark} viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12" strokeDasharray={stopped ? "3 3" : undefined} />
      <circle cx="14" cy="14" r="6.5" />
      {stopped ? (
        <path d="M7 21L21 7" />
      ) : (
        <circle className={styles.dot} cx="20.5" cy="7.5" r="3" />
      )}
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className={styles.stopIcon} viewBox="0 0 12 12" aria-hidden="true">
      <rect x="1.5" y="1.5" width="9" height="9" rx="2" />
    </svg>
  );
}

function announcement(kind: NexoBarKind, labels: NexoBarLabels): string {
  if (kind === "active") return labels.announceActive;
  if (kind === "stopped") return labels.announceStopped;
  if (kind === "waiting") return labels.announceWaiting;
  return "";
}

export function NexoBar({
  labels,
  state,
  onStop,
  onResume,
  busy = false,
  windowMs = defaultWindowMs,
}: NexoBarProps) {
  const textId = useId();
  const textRef = useRef<HTMLParagraphElement>(null);
  const kind = state.kind;
  const dueAt = state.kind === "countdown" ? state.dueAt : null;
  const now = useNow(dueAt);
  const stopped = kind === "stopped";

  const stop = () => {
    textRef.current?.focus();
    onStop();
  };

  const toggle = () => {
    if (busy) return;
    if (stopped) onResume();
    else onStop();
  };

  const progress: CSSProperties & Record<"--p", string> = {
    "--p": String(dueAt !== null && now !== null ? remainingFraction(dueAt, now, windowMs) : 1),
  };

  return (
    <div className={styles.bar} data-kind={kind} role="group" aria-label={labels.region}>
      <div className={styles.grid}>
        <Mark stopped={stopped} />
        <p ref={textRef} className={styles.text} id={textId} tabIndex={-1}>
          {kind === "countdown" ? (
            <>
              <b className={styles.title}>
                {labels.countdownTitle}{" "}
                <span className={styles.time} aria-hidden="true" data-testid="nexo-bar-time">
                  {dueAt !== null && now !== null ? formatCountdown(dueAt, now) : "-:--"}
                </span>
                <VisuallyHidden>
                  {dueAt !== null && now !== null ? describeApproximate(labels, dueAt, now) : ""}
                </VisuallyHidden>
              </b>
              <span className={styles.detail}>{labels.countdownText}</span>
            </>
          ) : kind === "active" ? (
            <>
              <b className={styles.title}>{labels.activeTitle}</b>
              <span className={styles.detail}>{labels.activeText}</span>
            </>
          ) : kind === "stopped" ? (
            <>
              <b className={styles.title}>{labels.stoppedTitle}</b>
              <span className={styles.detail}>{labels.stoppedText}</span>
            </>
          ) : (
            <>
              <b className={styles.title}>{labels.waitingTitle}</b>
              <span className={styles.detail}>{labels.waitingText}</span>
            </>
          )}
        </p>
        {kind === "active" ? (
          <Button
            variant="light"
            size="sm"
            icon={<StopIcon />}
            iconStart
            loading={busy}
            loadingLabel={labels.stopping}
            onClick={stop}
          >
            {labels.stop}
          </Button>
        ) : (
          <button
            type="button"
            className={styles.switch}
            role="switch"
            aria-checked={!stopped}
            aria-labelledby={textId}
            aria-disabled={busy || undefined}
            onClick={toggle}
          />
        )}
        {kind === "countdown" ? (
          <div className={styles.progress} aria-hidden="true">
            <i style={progress} />
          </div>
        ) : null}
      </div>
      <div role="status">
        <VisuallyHidden>{announcement(kind, labels)}</VisuallyHidden>
      </div>
    </div>
  );
}
