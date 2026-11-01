'use client';

import { useId } from 'react';

import { useFormContext } from '@/components/forms/form';

import styles from './field.module.css';

import type { ChangeEvent, HTMLInputAutoCompleteAttribute, ReactNode } from 'react';

type Common = {
  name: string;
  /** Already translated. */
  label: string;
  help?: string;
  /** Overrides the error coming from the enclosing `Form`. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
};

type TextLike = Common & {
  kind?: 'text' | 'email' | 'tel';
  defaultValue?: string;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  inputMode?: 'text' | 'numeric' | 'email' | 'tel';
  pattern?: string;
  maxLength?: number;
  minLength?: number;
  autoFocus?: boolean;
  spellCheck?: boolean;
  /** Visual size: `code` is the big centred field of a one-time code. */
  size?: 'md' | 'code';
};
type Textarea = Common & {
  kind: 'textarea';
  defaultValue?: string;
  rows?: number;
  maxLength?: number;
  autoComplete?: HTMLInputAutoCompleteAttribute;
};
type Select = Common & {
  kind: 'select';
  defaultValue?: string;
  options: readonly { value: string; label: string }[];
};
type Checkbox = Common & {
  kind: 'checkbox';
  value?: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
};
type RadioGroup = Common & {
  kind: 'radio-group';
  defaultValue?: string;
  options: readonly { value: string; label: ReactNode; description?: string }[];
  onChange?: (value: string) => void;
};
type Hidden = { kind: 'hidden'; name: string; value: string };

export type FieldProps = TextLike | Textarea | Select | Checkbox | RadioGroup | Hidden;

/**
 * One component for every control of a form (working-agreements §15, §17.3): it paints label, help
 * and error and wires `id`, `name`, `aria-describedby` and `aria-invalid` the same way every time.
 * No screen writes an `<input>` outside it. The error comes from the enclosing `Form` by `name`.
 *
 * A11y: the label is a real `<label>` (or the `<legend>` of a radio group's `<fieldset>`); help and
 * error are linked with `aria-describedby`; `aria-invalid` only when there is an error; controls
 * are at least 2.75rem tall (WCAG 2.2 target size); errors do not rely on colour alone.
 */
export function Field(props: FieldProps) {
  const form = useFormContext();
  const uid = useId();

  if (props.kind === 'hidden') {
    return <input type="hidden" name={props.name} value={props.value} />;
  }

  const error = props.error ?? form?.state.fieldErrors?.[props.name];
  const helpId = props.help ? `${uid}-help` : undefined;
  const errorId = error ? `${uid}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;
  const invalid = error ? true : undefined;
  const disabled = props.disabled ?? form?.pending;

  const message = (
    <>
      {props.help ? (
        <p id={helpId} className={styles.help}>
          {props.help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : null}
    </>
  );

  if (props.kind === 'radio-group') {
    return (
      <fieldset className={styles.field} aria-describedby={describedBy} disabled={disabled}>
        <legend className={styles.label}>{props.label}</legend>
        <div className={styles.options}>
          {props.options.map((option, index) => {
            const id = `${uid}-${index}`;
            return (
              <label key={option.value} htmlFor={id} className={styles.option}>
                <input
                  id={id}
                  type="radio"
                  name={props.name}
                  value={option.value}
                  defaultChecked={props.defaultValue === option.value}
                  required={props.required}
                  onChange={(event) => props.onChange?.(event.currentTarget.value)}
                />
                <span className={styles.optionBody}>
                  <span>{option.label}</span>
                  {option.description ? (
                    <span className={styles.help}>{option.description}</span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
        {message}
      </fieldset>
    );
  }

  if (props.kind === 'checkbox') {
    return (
      <div className={styles.field}>
        <label className={styles.option}>
          <input
            type="checkbox"
            name={props.name}
            value={props.value ?? 'on'}
            defaultChecked={props.defaultChecked}
            required={props.required}
            disabled={disabled}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              props.onChange?.(event.currentTarget.checked)
            }
          />
          <span className={styles.optionBody}>{props.label}</span>
        </label>
        {message}
      </div>
    );
  }

  const id = `${uid}-control`;
  const shared = {
    id,
    name: props.name,
    required: props.required,
    disabled,
    'aria-invalid': invalid,
    'aria-describedby': describedBy,
    className: styles.control,
  } as const;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {props.label}
      </label>
      {props.kind === 'textarea' ? (
        <textarea
          {...shared}
          rows={props.rows ?? 5}
          maxLength={props.maxLength}
          defaultValue={props.defaultValue}
          autoComplete={props.autoComplete}
        />
      ) : props.kind === 'select' ? (
        <select {...shared} defaultValue={props.defaultValue}>
          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...shared}
          type={props.kind ?? 'text'}
          data-size={props.size}
          defaultValue={props.defaultValue}
          autoComplete={props.autoComplete}
          inputMode={props.inputMode}
          pattern={props.pattern}
          maxLength={props.maxLength}
          minLength={props.minLength}
          autoFocus={props.autoFocus}
          spellCheck={props.spellCheck}
        />
      )}
      {message}
    </div>
  );
}
