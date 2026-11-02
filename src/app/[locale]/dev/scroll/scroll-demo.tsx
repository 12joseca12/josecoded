"use client";

import { useScrollProgress } from "@/lib/scroll/scroll-progress";
import { useBlockScroll } from "@/lib/scroll/use-block-scroll";

import styles from "./scroll-demo.module.css";

interface DemoBlock {
  id: string;
  title: string;
  body: string;
  tall: boolean;
}

interface ScrollDemoProps {
  title: string;
  progressLabel: string;
  more: string;
  blocks: DemoBlock[];
}

export function ScrollDemo({ title, progressLabel, more, blocks }: ScrollDemoProps) {
  useBlockScroll();
  const progress = useScrollProgress();

  return (
    <main>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.progress} role="status" aria-label={progressLabel}>
        <span className={styles.value} data-testid="progress">
          {Math.round(progress * 100)}
        </span>
        <span className={styles.bar} style={{ transform: `scaleX(${progress})` }} />
      </div>
      {blocks.map((block) => (
        <section
          key={block.id}
          id={block.id}
          className={styles.block}
          data-block=""
          data-tall={block.tall ? "" : undefined}
        >
          <h2 className={styles.heading}>{block.title}</h2>
          <p className={styles.body}>{block.body}</p>
          {block.tall
            ? Array.from({ length: 12 }, (_, index) => (
                <p key={index} className={styles.body}>
                  {more}
                </p>
              ))
            : null}
        </section>
      ))}
    </main>
  );
}
