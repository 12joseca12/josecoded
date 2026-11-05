import type { ManageResult, UserSheetLabels } from "@/types/users-manage";

import styles from "./UserSheet.module.css";

export type FeedbackState = { tone: "success" | "error"; text: string } | null;

export function describe(
  result: ManageResult,
  labels: UserSheetLabels,
  done: string,
): FeedbackState {
  if (result.status === "done") return { tone: "success", text: done };
  if (result.status === "invalid") return { tone: "error", text: labels.errors[result.field] };
  return { tone: "error", text: labels.errors[result.code] };
}

export function Feedback({ state }: { state: FeedbackState }) {
  return (
    <p
      className={styles.feedback}
      data-tone={state?.tone}
      role={state?.tone === "error" ? "alert" : "status"}
    >
      {state?.text}
    </p>
  );
}
