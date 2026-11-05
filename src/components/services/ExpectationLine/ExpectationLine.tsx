import styles from "./ExpectationLine.module.css";

interface ExpectationLineProps {
  label: string;
  children: string;
}

export function ExpectationLine({ label, children }: ExpectationLineProps) {
  return (
    <p className={styles.line}>
      <span className={styles.label}>{label}</span> {children}
    </p>
  );
}
