"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import type { ChatLabels, ChatMessage } from "@/types/chat";

import { ChatBubble, type ChatBubbleLabels } from "../ChatBubble/ChatBubble";
import styles from "./ChatThread.module.css";

export type ChatThreadLabels = ChatBubbleLabels & Pick<ChatLabels, "logLabel" | "typing">;

interface ChatThreadProps {
  messages: readonly ChatMessage[];
  greeting: ChatMessage | null;
  labels: ChatThreadLabels;
  typing: boolean;
  children?: ReactNode;
}

export function ChatThread({ messages, greeting, labels, typing, children }: ChatThreadProps) {
  const log = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const last = messages.at(-1)?.id;
  const hasExtra = children !== undefined && children !== null && children !== false;

  useEffect(() => {
    const node = log.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: reducedMotion ? "auto" : "smooth" });
  }, [last, typing, hasExtra, reducedMotion]);

  return (
    <div
      ref={log}
      className={styles.log}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label={labels.logLabel}
      tabIndex={0}
    >
      <ul className={styles.list}>
        {greeting ? <ChatBubble message={greeting} labels={labels} /> : null}
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} labels={labels} />
        ))}
        {typing ? (
          <li className={styles.typing} data-variant="nexo">
            <VisuallyHidden>{labels.typing}</VisuallyHidden>
            <span className={styles.dots} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </li>
        ) : null}
      </ul>
      {children}
    </div>
  );
}
