"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

import styles from "./ChatThread.module.css";

interface ChatThreadProps {
  label: string;
  empty: string;
  count: number;
  children: ReactNode;
}

const nearBottomRem = 5;

export function ChatThread({ label, empty, count, children }: ChatThreadProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const stuck = useRef(true);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const element = scroller.current;
    if (!element || !stuck.current) return;
    element.scrollTo({ top: element.scrollHeight, behavior: reduced ? "instant" : "smooth" });
  }, [count, reduced]);

  const onScroll = () => {
    const element = scroller.current;
    if (!element) return;
    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const gap = element.scrollHeight - element.scrollTop - element.clientHeight;
    stuck.current = gap <= nearBottomRem * rem;
  };

  return (
    <div
      ref={scroller}
      className={styles.thread}
      role="log"
      aria-label={label}
      aria-live="polite"
      aria-relevant="additions"
      tabIndex={0}
      onScroll={onScroll}
    >
      {count === 0 ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        <ol className={styles.list}>{children}</ol>
      )}
    </div>
  );
}
