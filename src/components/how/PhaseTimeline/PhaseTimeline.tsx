"use client";

import { type KeyboardEvent, useId, useRef, useState } from "react";

import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import { isTimelineKey, nextPhaseIndex } from "@/lib/how/timeline";
import type { TimelineLabels, TimelinePhase } from "@/types/how";

import styles from "./PhaseTimeline.module.css";

interface PhaseTimelineProps {
  phases: TimelinePhase[];
  labels: TimelineLabels;
}

export function PhaseTimeline({ phases, labels }: PhaseTimelineProps) {
  const [current, setCurrent] = useState(0);
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabId = (index: number) => `${base}-tab-${index}`;
  const panelId = (index: number) => `${base}-panel-${index}`;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isTimelineKey(event.key)) return;
    event.preventDefault();
    const next = nextPhaseIndex(event.key, current, phases.length);
    setCurrent(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className={styles.timeline} data-current={current}>
      <div
        className={styles.tabs}
        role="tablist"
        aria-label={labels.list}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.track} aria-hidden="true">
          <span className={styles.fill} />
        </span>
        {phases.map((phase, index) => (
          <button
            key={phase.id}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={tabId(index)}
            className={styles.tab}
            aria-selected={index === current}
            aria-controls={panelId(index)}
            tabIndex={index === current ? 0 : -1}
            data-status={index < current ? "done" : index === current ? "current" : "next"}
            onClick={() => {
              setCurrent(index);
            }}
          >
            <span className={styles.node} aria-hidden="true">
              {index + 1}
            </span>
            <span className={styles.name}>{phase.title}</span>
          </button>
        ))}
      </div>
      {phases.map((phase, index) => (
        <div
          key={phase.id}
          role="tabpanel"
          id={panelId(index)}
          aria-labelledby={tabId(index)}
          className={styles.panel}
          hidden={index !== current}
          tabIndex={0}
          data-phase={phase.id}
        >
          <Card size="lg" className={styles.card}>
            <div className={styles.lead}>
              <Heading level={3}>{phase.title}</Heading>
              <p className={styles.summary}>{phase.summary}</p>
            </div>
            <div className={styles.detail}>
              <p className={styles.label}>{labels.getsLabel}</p>
              <ul className={styles.gets}>
                {phase.gets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className={styles.label}>{labels.needsLabel}</p>
              <p className={styles.needs}>{phase.needs}</p>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
