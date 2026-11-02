'use client';

import { useId } from 'react';

import { useFormContext } from '@/components/forms/form';
import { Icon } from '@/components/ui/icon';

import styles from './field.module.css';

import type { IconName } from '@josecoded/types';
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
  /** The label stays in the DOM for assistive technology and the form, but is not drawn (a toolbar has its own context). */
  hideLabel?: boolean;
};

type TextLike = Common & {
  kind?: 'text' | 'email' | 'tel' | 'date' | 'time' | 'search';
  placeholder?: string;
  /** An icon inside the field, on the left (a search). Decoration: the label names the field. */
  leading?: IconName;
  /** Something inside the field, on the right (the key that focuses it). Never interactive. */
  trailing?: ReactNode;
  /** A single key that focuses the field from anywhere (`/`): announced with `aria-keyshortcuts`, bound by the screen. */
  hotkey?: string;
  defaultValue?: string;
  /** Controlled: the screen keeps the text (a note shared by several dialogs). */
  value?: string;
  onChange?: (value: string) => void;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel';
  pattern?: string;
  maxLength?: number;
  minLength?: number;
  autoFocus?: boolean;
  spellCheck?: boolean;
  /** Visual size: `code` is the big centred field of a one-time code, `compact` the one of a toolbar. */
  size?: 'md' | 'code' | 'compact';
};
type Textarea = Common & {
  kind: 'textarea';
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  /** `compact` is the composer of a note: smaller type, a floor of 6rem. */
  size?: 'md' | 'compact';
  maxLength?: number;
  autoComplete?: HTMLInputAutoCompleteAttribute;
};
type Select = Common & {
  kind: 'select';
  defaultValue?: string;
  options: readonly { value: string; label: string }[];
  size?: 'md' | 'compact';
  /** Controlled: the screen decides what is selected (a mapping where choosing in one select changes another). */
  value?: string;
  onChange?: (value: string) => void;
};
type Checkbox = Common & {
  kind: 'checkbox';
  value?: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  /** `chip` is the filter toggle of a toolbar: a pill that reads as pressed when it is on. */
  appearance?: 'check' | 'chip';
  /** Chip only: icon before the label and a number after it. */
  icon?: IconName;
  count?: ReactNode;
};
type RadioGroup = Common & {
  kind: 'radio-group';
  defaultValue?: string;
  options: readonly { value: string; label: ReactNode; description?: string }[];
  onChange?: (value: string) => void;
};
type FileInput = Common & {
  kind: 'file';
  /** Comma-separated MIME types or extensions: a convenience for the picker, never the check. */
  accept?: string;
  onChange?: (file: File | null) => void;
};
type Hidden = { kind: 'hidden'; name: string; value: string };

export type FieldProps = TextLike | Textarea | Select | Checkbox | RadioGroup | FileInput | Hidden;

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
  // while pending the controls stay focusable and keep what was typed: `readOnly` where it exists,
  // `aria-disabled` elsewhere (a `disabled` control drops focus and, in a fieldset, its value)
  const pending = props.disabled === undefined && form?.pending === true;
  const disabled = props.disabled;
  const kept = form?.state.values?.[props.name];

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
      <fieldset
        className={styles.field}
        aria-describedby={describedBy}
        aria-disabled={pending || undefined}
        disabled={disabled}
      >
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

  if (props.kind === 'checkbox' && props.appearance === 'chip') {
    return (
      <label className={styles.chip}>
        <input
          type="checkbox"
          name={props.name}
          value={props.value ?? 'on'}
          defaultChecked={props.defaultChecked}
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            props.onChange?.(event.currentTarget.checked)
          }
        />
        {props.icon ? <Icon name={props.icon} /> : null}
        {props.label}
        {props.count !== undefined ? <span className={styles.count}>{props.count}</span> : null}
      </label>
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
            aria-disabled={pending || undefined}
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
    'aria-disabled': pending || undefined,
    'aria-invalid': invalid,
    'aria-describedby': describedBy,
    className: styles.control,
  } as const;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={props.hideLabel ? 'sr-only' : styles.label}>
        {props.label}
      </label>
      {props.kind === 'textarea' ? (
        <textarea
          {...shared}
          data-size={props.size}
          placeholder={props.placeholder}
          rows={props.rows ?? 5}
          maxLength={props.maxLength}
          readOnly={pending || undefined}
          key={`${props.name}:${kept ?? ''}`}
          defaultValue={kept ?? props.defaultValue}
          autoComplete={props.autoComplete}
        />
      ) : props.kind === 'file' ? (
        <input
          {...shared}
          type="file"
          accept={props.accept}
          onChange={(event) => props.onChange?.(event.currentTarget.files?.[0] ?? null)}
        />
      ) : props.kind === 'select' ? (
        <select
          {...shared}
          data-size={props.size}
          key={`${props.name}:${kept ?? ''}`}
          {...(props.value !== undefined
            ? { value: props.value }
            : { defaultValue: kept ?? props.defaultValue })}
          onChange={(event) => props.onChange?.(event.currentTarget.value)}
        >
          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : props.leading || props.trailing ? (
        <div className={styles.adorned}>
          {props.leading ? <Icon name={props.leading} /> : null}
          <input key={`${props.name}:${kept ?? ''}`} {...textProps(props, shared, pending, kept)} />
          {props.trailing ? <span className={styles.trailing}>{props.trailing}</span> : null}
        </div>
      ) : (
        <input key={`${props.name}:${kept ?? ''}`} {...textProps(props, shared, pending, kept)} />
      )}
      {message}
    </div>
  );
}

/** The attributes of a text-like `<input>`, shared by the plain and the adorned forms. */
function textProps(
  props: TextLike,
  shared: Record<string, unknown>,
  pending: boolean,
  kept: string | undefined,
) {
  return {
    ...shared,
    type: props.kind ?? 'text',
    placeholder: props.placeholder,
    'data-size': props.size,
    'data-adorned': props.leading || props.trailing ? 'true' : undefined,
    'data-hotkey': props.hotkey,
    'aria-keyshortcuts': props.hotkey,
    readOnly: pending || undefined,
    ...(props.value !== undefined
      ? { value: props.value }
      : { defaultValue: kept ?? props.defaultValue }),
    onChange: props.onChange
      ? (event: ChangeEvent<HTMLInputElement>) => props.onChange?.(event.currentTarget.value)
      : undefined,
    autoComplete: props.autoComplete,
    inputMode: props.inputMode,
    pattern: props.pattern,
    maxLength: props.maxLength,
    minLength: props.minLength,
    autoFocus: props.autoFocus,
    spellCheck: props.spellCheck,
  };
}
