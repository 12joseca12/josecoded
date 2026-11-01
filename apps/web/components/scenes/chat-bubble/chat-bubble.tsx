import styles from './chat-bubble.module.css';

/**
 * One line of the example conversation. `visitor` sits right in violet, `author` left in glass. The
 * visible text is typed by `MiniChat` and is `aria-hidden`; a visually hidden copy of the whole
 * line is what assistive technology reads, so a half-typed sentence is never announced.
 */
export function ChatBubble({ from, text }: { from: 'visitor' | 'author'; text: string }) {
  return (
    <p className={styles.bubble} data-from={from} data-on="">
      <span data-typed aria-hidden="true">
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </p>
  );
}
