import styles from "./AccountFeedback.module.css";

export interface FeedbackState {
  tone: "success" | "error";
  text: string;
}

export function AccountFeedback({ feedback }: { feedback: FeedbackState | null }) {
  return (
    <>
      <p className={styles.feedback} data-tone="success" role="status">
        {feedback?.tone === "success" ? feedback.text : null}
      </p>
      <p className={styles.feedback} data-tone="error" role="alert">
        {feedback?.tone === "error" ? feedback.text : null}
      </p>
    </>
  );
}
