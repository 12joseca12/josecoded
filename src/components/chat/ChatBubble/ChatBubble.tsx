import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import type { ChatLabels, ChatMessage } from "@/types/chat";

import { AttachmentChip } from "../AttachmentChip/AttachmentChip";
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
  if (message.authorName) return message.authorName;
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
  const own = message.own ?? message.variant === "visitor";
  const attachments = message.attachments ?? [];
  return (
    <li
      className={styles.item}
      data-variant={message.variant}
      data-own={own ? "true" : undefined}
      data-delivery={message.delivery}
    >
      {message.variant === "visitor" && own ? (
        <VisuallyHidden>{author}</VisuallyHidden>
      ) : (
        <span className={styles.author}>
          {author}
          {message.time ? <span className={styles.time}>{message.time}</span> : null}
        </span>
      )}
      {message.note ? <span className={styles.meta}>{message.note}</span> : null}
      <p className={styles.bubble}>{message.body}</p>
      {attachments.length > 0 ? (
        <ul className={styles.attachments}>
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              <AttachmentChip
                href={attachment.href}
                name={attachment.name}
                size={attachment.size}
                title={attachment.title}
              />
            </li>
          ))}
        </ul>
      ) : null}
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
