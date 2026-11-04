"use client";

import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import type { NexoSize, NexoState } from "@/types/nexo";

import { Nexo } from "../Nexo/Nexo";
import styles from "./NexoFaqChat.module.css";

interface NexoAvatarProps {
  state: NexoState;
  label: string;
  size?: NexoSize;
}

export function NexoAvatar({ state, label, size = "sm" }: NexoAvatarProps) {
  const [node, setNode] = useState<HTMLSpanElement | null>(null);
  const [seen, setSeen] = useState(false);
  const [visible, setVisible] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      const last = entries.at(-1);
      if (!last) return;
      setVisible(last.isIntersecting);
      if (last.isIntersecting) setSeen(true);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [node]);

  return (
    <span ref={setNode} className={styles.avatar} data-size={size}>
      {seen ? (
        <Nexo
          state={state}
          label={label}
          size={size}
          reducedMotion={reducedMotion}
          paused={!visible}
        />
      ) : null}
    </span>
  );
}
