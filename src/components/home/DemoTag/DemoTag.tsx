import styles from "./DemoTag.module.css";

interface DemoTagProps {
  label: string;
}

export function DemoTag({ label }: DemoTagProps) {
  return (
    <span className={styles.tag} data-demo-tag="">
      {label}
    </span>
  );
}
