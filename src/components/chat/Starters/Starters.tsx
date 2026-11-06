import styles from "./Starters.module.css";

interface StartersProps {
  label: string;
  items: readonly string[];
  disabled: boolean;
  onPick: (text: string) => void;
}

export function Starters({ label, items, disabled, onPick }: StartersProps) {
  return (
    <div className={styles.starters} role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={styles.chip}
          aria-disabled={disabled || undefined}
          onClick={() => {
            if (!disabled) onPick(item);
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
