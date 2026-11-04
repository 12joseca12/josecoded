"use client";

import { useEffect, useRef, useState } from "react";

import { Nexo } from "@/components/chat/Nexo/Nexo";
import type { NexoState } from "@/types/nexo";

import styles from "./NexoGuideBubble.module.css";

interface NexoGuideBubbleProps {
  id: string;
  state: NexoState;
  text: string;
  labels: { avatar: string; name: string; role: string; disclosure: string };
}

export function NexoGuideBubble({ id, state, text, labels }: NexoGuideBubbleProps) {
  const holder = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <aside className={styles.guide} aria-label={labels.name} data-nexo-state={state}>
      <div ref={holder} className={styles.avatar}>
        {near ? (
          <Nexo state={state} label={labels.avatar} size="md" />
        ) : (
          <span className={styles.placeholder} aria-hidden="true" />
        )}
      </div>
      <div className={styles.bubble}>
        <p className={styles.who}>
          <strong>{labels.name}</strong>
          <span className={styles.role}>{labels.role}</span>
        </p>
        <p id={id} className={styles.text} key={text}>
          {text}
        </p>
        <p className={styles.disclosure}>{labels.disclosure}</p>
      </div>
    </aside>
  );
}
