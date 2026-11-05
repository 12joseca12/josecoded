import type { PriceStateSize, PriceStateVariant } from "@/types/ui";

import styles from "./PriceState.module.css";

interface PriceStateBase {
  size?: PriceStateSize;
  className?: string;
}

interface PriceStateReview extends PriceStateBase {
  variant: Extract<PriceStateVariant, "review">;
  label: string;
  note?: string;
}

interface PriceStateAmount extends PriceStateBase {
  variant: Exclude<PriceStateVariant, "review">;
  amount: string;
  unit: string;
  prefix?: string;
  caption?: string;
}

export type PriceStateProps = PriceStateReview | PriceStateAmount;

export function PriceState(props: PriceStateProps) {
  const { variant, size = "md", className } = props;
  const classes = className ? `${styles.price} ${className}` : styles.price;

  if (props.variant === "review") {
    return (
      <span className={classes} data-variant={variant} data-size={size}>
        <strong className={styles.label}>{props.label}</strong>
        {props.note ? <span className={styles.note}>{props.note}</span> : null}
      </span>
    );
  }

  return (
    <span className={classes} data-variant={variant} data-size={size}>
      <span className={styles.figure}>
        {props.prefix ? <span className={styles.unit}>{props.prefix}</span> : null}
        <strong className={styles.amount}>{props.amount}</strong>
        <span className={styles.unit}>{props.unit}</span>
      </span>
      {props.caption ? <span className={styles.note}>{props.caption}</span> : null}
    </span>
  );
}
