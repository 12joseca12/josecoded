import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import type { ChatLabels, ChatMessage } from "@/types/chat";

import styles from "./ChatBubble.module.css";

export type ChatBubbleLabels = Pick<
  ChatLabels,
  "nexoName" | "you" | "jose" | "sourcesLabel" | "sending" | "failed" | "systemEvents"
>;

interface ChatBubbleProps {
  message: ChatMessage;
  labels: ChatBubbleLabels;
}

function authorOf(message: ChatMessage, labels: ChatBubbleLabels): string {
  if (message.variant === "visitor") return labels.you;
  if (message.variant === "nexo") return labels.nexoName;
  return message.authorName ?? labels.jose;
}

export function ChatBubble({ message, labels }: ChatBubbleProps) {
  if (message.variant === "system") {
    const text = message.systemEvent ? labels.systemEvents[message.systemEvent] : message.body;
    return (
      <li className={styles.item} data-variant="system">
        <p className={styles.system}>{text}</p>
      </li>
    );
  }
  const author = authorOf(message, labels);
  return (
    <li className={styles.item} data-variant={message.variant} data-delivery={message.delivery}>
      {message.variant === "visitor" ? (
        <VisuallyHidden>{author}</VisuallyHidden>
      ) : (
        <span className={styles.author}>{author}</span>
      )}
      <p className={styles.bubble}>{message.body}</p>
      {message.sources.length > 0 ? (
        <ul className={styles.sources} aria-label={labels.sourcesLabel}>
          {message.sources.map((source) => (
            <li key={source} className={styles.source}>
              {source}
            </li>
          ))}
        </ul>
      ) : null}
      {message.delivery === "sending" ? (
        <span className={styles.meta}>{labels.sending}</span>
      ) : null}
      {message.delivery === "failed" ? <span className={styles.meta}>{labels.failed}</span> : null}
    </li>
  );
}
