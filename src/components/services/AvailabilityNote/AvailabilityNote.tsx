import styles from "./AvailabilityNote.module.css";

interface AvailabilityNoteProps {
  label: string;
  lines: string[];
  updated: string;
}

export function AvailabilityNote({ label, lines, updated }: AvailabilityNoteProps) {
  if (lines.length === 0) return null;
  return (
    <p className={styles.note} data-availability="">
      <strong className={styles.label}>{label}</strong> {lines.join(" · ")}
      <span className={styles.updated}>{updated}</span>
    </p>
  );
}
