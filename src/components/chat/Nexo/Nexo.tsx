"use client";

import { lazy, Suspense } from "react";

import type { NexoSize, NexoState } from "@/types/nexo";

import styles from "./Nexo.module.css";

export interface NexoProps {
  state: NexoState;
  label: string;
  size?: NexoSize;
  reducedMotion?: boolean;
}

const NexoScene = lazy(() =>
  import("./NexoScene").then((module) => ({ default: module.NexoScene })),
);

export function Nexo({ state, label, size = "md", reducedMotion = false }: NexoProps) {
  return (
    <Suspense
      fallback={<span className={styles.placeholder} data-size={size} aria-hidden="true" />}
    >
      <NexoScene state={state} label={label} size={size} reducedMotion={reducedMotion} />
    </Suspense>
  );
}
