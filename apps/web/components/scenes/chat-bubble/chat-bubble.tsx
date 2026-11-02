import styles from './chat-bubble.module.css';

type ChatBubbleBase = { text: string };
type Typed = ChatBubbleBase & {
  /** `visitor` sits right in violet, `author` left in glass. */
  from: 'visitor' | 'author';
  plain?: false;
};
type Plain = ChatBubbleBase & {
  /** The three voices of the chat: the visitor, the assistant and Jose once he takes over. */
  from: 'visitor' | 'assistant' | 'jose';
  /** A message of a real thread: always visible, plain text, no typing. */
  plain: true;
  /** Visible name of who speaks (not shown for the visitor); also read before the text. */
  sender?: string;
};

/**
 * One line of a conversation. In the home example (`MiniChat`) the visible text is typed and is
 * `aria-hidden`; a visually hidden copy of the whole line is what assistive technology reads, so a
 * half-typed sentence is never announced. With `plain` it is a message of the chat: the text is
 * rendered as text (never HTML or Markdown), line breaks are kept and long words wrap.
 */
export function ChatBubble(props: Typed | Plain) {
  if (props.plain) {
    const { from, text, sender } = props;
    const spoken = sender ? `${sender}: ` : null;
    return (
      <div className={styles.line} data-from={from}>
        {sender && from !== 'visitor' ? (
          <span className={styles.sender} aria-hidden="true">
            {sender}
          </span>
        ) : null}
        <p className={styles.bubble} data-from={from} data-on="" data-plain="">
          {spoken ? <span className="sr-only">{spoken}</span> : null}
          {text}
        </p>
      </div>
    );
  }
  return (
    <p className={styles.bubble} data-from={props.from} data-on="">
      <span data-typed aria-hidden="true">
        {props.text}
      </span>
      <span className="sr-only">{props.text}</span>
    </p>
  );
}
