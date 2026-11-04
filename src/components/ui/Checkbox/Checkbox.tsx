import { type ComponentPropsWithoutRef, type ReactNode, useId } from "react";

import { FieldError } from "../Field/FieldError";
import styles from "./Checkbox.module.css";

interface CheckboxProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "id" | "type" | "children" | "aria-invalid" | "aria-describedby"
> {
  name: string;
  children: ReactNode;
  error?: string;
}

export function Checkbox({ children, error, ...rest }: CheckboxProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={styles.checkbox} data-invalid={error ? "true" : undefined}>
      <div className={styles.row}>
        <input
          {...rest}
          id={id}
          type="checkbox"
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <label htmlFor={id} className={styles.label}>
          {children}
        </label>
        <svg className={styles.mark} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
        </svg>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
