import type { CSSProperties } from "react";

import type { SkeletonShape } from "@/types/ui";

import styles from "./Skeleton.module.css";

export interface SkeletonProps {
  shape?: SkeletonShape;
  lines?: number;
  width?: string;
  height?: string;
}

export function Skeleton({ shape = "block", lines = 1, width, height }: SkeletonProps) {
  const style = { "--sk-w": width, "--sk-h": height } as CSSProperties;

  if (shape === "text") {
    return (
      <span className={styles.lines} aria-hidden="true" style={style}>
        {Array.from({ length: Math.max(lines, 1) }, (_, index) => (
          <span key={index} className={styles.skeleton} data-shape="text" />
        ))}
      </span>
    );
  }

  return <span className={styles.skeleton} data-shape={shape} aria-hidden="true" style={style} />;
}
