import styles from "./SkipLink.module.css";

export const contentId = "content";

export function SkipLink({ label }: { label: string }) {
  return (
    <a href={`#${contentId}`} className={styles.skip}>
      {label}
    </a>
  );
}
