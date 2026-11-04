import { type ComponentPropsWithoutRef, useId } from "react";

import styles from "./Field.module.css";
import { FieldError } from "./FieldError";

interface FieldShared {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  optionalLabel?: string;
}

type InputFieldProps = FieldShared & { control?: "input" } & Omit<
    ComponentPropsWithoutRef<"input">,
    keyof FieldShared | "id" | "aria-invalid" | "aria-describedby"
  >;

type TextareaFieldProps = FieldShared & { control: "textarea" } & Omit<
    ComponentPropsWithoutRef<"textarea">,
    keyof FieldShared | "id" | "aria-invalid" | "aria-describedby"
  >;

export type FieldProps = InputFieldProps | TextareaFieldProps;

export function Field(props: FieldProps) {
  const { name, label, hint, error, optionalLabel, control, ...rest } = props;
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");
  const shared = {
    id,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
    className: styles.control,
  };

  return (
    <div className={styles.field} data-invalid={error ? "true" : undefined}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {optionalLabel ? <span className={styles.optional}>{optionalLabel}</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {control === "textarea" ? (
        <textarea {...(rest as ComponentPropsWithoutRef<"textarea">)} {...shared} />
      ) : (
        <input {...(rest as ComponentPropsWithoutRef<"input">)} {...shared} />
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
