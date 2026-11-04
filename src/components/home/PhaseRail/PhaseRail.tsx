"use client";

import type { AnimationEvent } from "react";

import { phaseStatus } from "@/lib/hero/sequence";
import type { PhaseItem, RailLabels } from "@/types/hero";

import styles from "./PhaseRail.module.css";

interface PhaseRailProps {
  phases: PhaseItem[];
  labels: RailLabels;
  current: number;
  paused: boolean;
  userPaused: boolean;
  reduced: boolean;
  live: boolean;
  onSelect: (phase: number) => void;
  onToggle: () => void;
  onCycleEnd: () => void;
}

function Ring() {
  return (
    <svg className={styles.ring} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle className={styles.track} cx="10" cy="10" r="8" />
      <circle className={styles.fill} cx="10" cy="10" r="8" pathLength="1" data-fill="" />
    </svg>
  );
}

export function PhaseRail({
  phases,
  labels,
  current,
  paused,
  userPaused,
  reduced,
  live,
  onSelect,
  onToggle,
  onCycleEnd,
}: PhaseRailProps) {
  const handleEnd = (event: AnimationEvent<HTMLElement>) => {
    if (event.target instanceof Element && event.target.hasAttribute("data-fill")) onCycleEnd();
  };

  return (
    <div
      className={styles.rail}
      data-paused={paused ? "" : undefined}
      data-live={live ? "" : undefined}
      data-reduced={reduced ? "" : undefined}
    >
      <ol className={styles.list} aria-label={labels.list} onAnimationEnd={handleEnd}>
        {phases.map((phase, index) => {
          const status = phaseStatus(index, current);
          const aria = status === "current" ? "step" : undefined;
          return (
            <li key={phase.id}>
              {reduced ? (
                <span className={styles.phase} data-status={status} aria-current={aria}>
                  <span className={styles.label}>{phase.label}</span>
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.phase}
                  data-status={status}
                  aria-current={aria}
                  onClick={() => {
                    onSelect(index);
                  }}
                >
                  <Ring />
                  <span className={styles.label}>{phase.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
      {reduced ? null : (
        <button
          type="button"
          className={styles.pause}
          aria-label={userPaused ? labels.resume : labels.pause}
          onClick={onToggle}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            {userPaused ? <path d="M5 3.2v9.6L12.5 8z" /> : <path d="M5.5 3.5v9M10.5 3.5v9" />}
          </svg>
          <span className={styles.pauseText}>
            {userPaused ? labels.resumeText : labels.pauseText}
          </span>
        </button>
      )}
    </div>
  );
}
