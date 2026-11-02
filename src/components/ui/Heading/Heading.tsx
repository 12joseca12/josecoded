import type { ReactNode } from "react";

import type { HeadingLevel, HeadingSize } from "@/types/ui";

import styles from "./Heading.module.css";

export interface HeadingProps {
  level: HeadingLevel;
  size?: HeadingSize;
  accent?: ReactNode;
  id?: string;
  children: ReactNode;
}

const tags = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;
const space = " ";

export function Heading({ level, size, accent, id, children }: HeadingProps) {
  const Tag = tags[level];
  return (
    <Tag id={id} className={styles.heading} data-size={size ?? tags[level]}>
      {children}
      {accent ? (
        <>
          {space}
          <span className={styles.accent}>{accent}</span>
        </>
      ) : null}
    </Tag>
  );
}
