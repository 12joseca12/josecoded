import styles from "./StackChips.module.css";

interface StackChipsProps {
  items: string[];
  tone?: "light" | "dark";
}

export function StackChips({ items, tone = "light" }: StackChipsProps) {
  return (
    <ul className={styles.chips} data-tone={tone}>
      {items.map((item) => (
        <li key={item} className={styles.chip}>
          {item}
        </li>
      ))}
    </ul>
  );
}
