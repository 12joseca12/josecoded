import styles from "./ProgressRing.module.css";

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  variant?: "steps";
  size?: "md" | "lg";
}

const radius = 20;
const circumference = 2 * Math.PI * radius;

export function ProgressRing({
  value,
  max,
  label,
  variant = "steps",
  size = "md",
}: ProgressRingProps) {
  const done = Math.min(Math.max(value, 0), max);
  const count = `${done}/${max}`;
  const offset = circumference * (1 - done / max);
  return (
    <span
      className={styles.ring}
      data-variant={variant}
      data-size={size}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle className={styles.track} cx="24" cy="24" r={radius} />
        <circle
          className={styles.bar}
          cx="24"
          cy="24"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={styles.count} aria-hidden="true">
        {count}
      </span>
    </span>
  );
}
