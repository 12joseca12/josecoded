import styles from "./MessageExample.module.css";

interface MessageExampleProps {
  summary: string;
  example: string;
}

export function MessageExample({ summary, example }: MessageExampleProps) {
  return (
    <details className={styles.example} data-testid="message-example">
      <summary className={styles.summary}>{summary}</summary>
      <p className={styles.text}>{example}</p>
    </details>
  );
}
