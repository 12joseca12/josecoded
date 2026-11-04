import { useId } from "react";

import { FieldError } from "../Field/FieldError";
import styles from "./ChoiceGroup.module.css";

export interface ChoiceOption {
  value: string;
  label: string;
  hint?: string;
}

interface ChoiceGroupProps {
  name: string;
  legend: string;
  options: readonly ChoiceOption[];
  defaultValue?: string | null;
  error?: string;
  required?: boolean;
}

export function ChoiceGroup({
  name,
  legend,
  options,
  defaultValue = null,
  error,
  required = false,
}: ChoiceGroupProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <fieldset
      className={styles.group}
      data-invalid={error ? "true" : undefined}
      role="radiogroup"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const hintId = `${optionId}-hint`;
          return (
            <div key={option.value} className={styles.option}>
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                defaultChecked={option.value === defaultValue}
                required={required}
                aria-describedby={option.hint ? hintId : undefined}
                className={styles.input}
              />
              <label htmlFor={optionId} className={styles.card}>
                <span className={styles.label}>{option.label}</span>
                {option.hint ? (
                  <span id={hintId} className={styles.hint}>
                    {option.hint}
                  </span>
                ) : null}
              </label>
            </div>
          );
        })}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}
