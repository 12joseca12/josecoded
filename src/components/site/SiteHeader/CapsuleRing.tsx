"use client";

import { useEffect, useRef, useState } from "react";

import { ringDashOffset, ringPath } from "@/lib/nav/nav";
import { useScrollProgress } from "@/lib/scroll/scroll-progress";

import styles from "./CapsuleRing.module.css";

export function CapsuleRing() {
  const progress = useScrollProgress();
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const bar = ref.current?.parentElement;
    if (!bar) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.borderBoxSize[0];
      if (box) setSize({ width: box.inlineSize, height: box.blockSize });
    });
    observer.observe(bar);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <svg ref={ref} className={styles.ring} aria-hidden="true" focusable="false">
      <path
        className={styles.fill}
        d={ringPath(size.width, size.height)}
        pathLength={1}
        style={{ strokeDashoffset: ringDashOffset(progress) }}
      />
    </svg>
  );
}
