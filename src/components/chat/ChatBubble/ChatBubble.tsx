import type { ReactNode } from "react";

import styles from "./ChatBubble.module.css";

export const bubbleVariants = ["visitor", "nexo", "staff", "system"] as const;
export type BubbleVariant = (typeof bubbleVariants)[number];

interface ChatBubbleProps {
  variant: BubbleVariant;
  own?: boolean;
  author?: string;
  time?: ReactNode;
  note?: string;
  sources?: readonly string[];
  children: ReactNode;
}

export function ChatBubble({
  variant,
  own = false,
  author,
  time,
  note,
  sources = [],
  children,
}: ChatBubbleProps) {
  return (
    <div className={styles.row} data-variant={variant} data-own={own ? "true" : undefined}>
      {variant === "system" ? (
        <p className={styles.system}>{children}</p>
      ) : (
        <div className={styles.bubble}>
          {author || time ? (
            <p className={styles.meta}>
              {author ? <span className={styles.author}>{author}</span> : null}
              {time ? <span className={styles.time}>{time}</span> : null}
            </p>
          ) : null}
          {note ? <p className={styles.note}>{note}</p> : null}
          <p className={styles.body}>{children}</p>
          {sources.length > 0 ? (
            <ul className={styles.sources}>
              {sources.map((source) => (
                <li key={source} className={styles.source}>
                  {source}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
