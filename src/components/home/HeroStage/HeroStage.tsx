"use client";

import { type ReactNode, useRef } from "react";

import { useHeroSequence } from "@/lib/hero/use-hero-sequence";
import type { PhaseItem, RailLabels } from "@/types/hero";

import { PhaseRail } from "../PhaseRail/PhaseRail";
import styles from "./HeroStage.module.css";

interface HeroStageProps {
  phases: PhaseItem[];
  labels: RailLabels;
  children: ReactNode;
}

export function HeroStage({ phases, labels, children }: HeroStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const sequence = useHeroSequence(stageRef);

  return (
    <div className={styles.visual}>
      <div
        ref={stageRef}
        className={styles.stage}
        data-phase={sequence.phase}
        data-parity={sequence.parity}
        data-paused={sequence.paused ? "" : undefined}
        aria-hidden="true"
      >
        {children}
      </div>
      <PhaseRail
        phases={phases}
        labels={labels}
        current={sequence.phase}
        paused={sequence.paused}
        userPaused={sequence.userPaused}
        reduced={sequence.reduced}
        live={sequence.live}
        onSelect={sequence.select}
        onToggle={sequence.toggle}
        onCycleEnd={sequence.advance}
      />
    </div>
  );
}
