'use client';

import { useActionState, useEffect, useId, useMemo, useRef } from 'react';

import { Button } from '@/components/ui/button';

import { FormContext } from './form-context';
import styles from './form.module.css';

import type { ButtonSize, ButtonVariant, FormState } from '@josecoded/types';
import type { ReactNode } from 'react';

type Action<S> = (previous: S, data: FormData) => Promise<S>;

export interface FormProps<S> {
  action: Action<S>;
  /** Already translated by the page. */
  submitLabel: string;
  submitVariant?: ButtonVariant;
  submitSize?: ButtonSize;
  /** `end` pushes the actions to the trailing edge (a composer's small button). */
  actionsAlign?: 'start' | 'end';
  /** Tighter gap between the fields and the actions (a one-field composer). */
  compact?: boolean;
  /** Accessible name of the form (a `<form>` is a landmark only when it has one). */
  label?: string;
  /** Shown (and announced) when the action answers `ok`. */
  successMessage?: string;
  /** Clears the fields after an `ok` answer (a comment box that was just sent). */
  resetOnSuccess?: boolean;
  /** Extra controls next to the submit button (a cancel link, a secondary action). */
  actions?: ReactNode;
  /** The fields; a function receives the last state when the action returns extra data (a QR code). */
  children: ReactNode | ((state: S) => ReactNode);
}

const initial: FormState<never> = { status: 'idle' };

/**
 * Form driven by a Server Action (`useActionState`, working-agreements §17.3). It works without
 * JavaScript; with it, the button shows `pending`, errors appear per field without a reload and
 * focus moves to the first invalid field (or to the error summary when the error is general).
 * Validation lives only in the action (zod from `@josecoded/types`): the HTML attributes on the
 * fields are a convenience, never the guard.
 *
 * A11y: `role="alert"` summary (focusable, receives focus on a general error); each `Field` exposes
 * `aria-invalid` + `aria-describedby`; the success message lives in a persistent `role="status"` that
 * takes focus when it fills; while pending the submit button is `aria-disabled` and the fields read-only
 * (nothing loses focus) and the form is `aria-busy`.
 */
export function Form<S extends FormState<never> = FormState<Record<string, unknown>>>({
  action,
  submitLabel,
  submitVariant = 'solid',
  submitSize = 'md',
  actionsAlign = 'start',
  compact = false,
  label,
  successMessage,
  resetOnSuccess = false,
  actions,
  children,
}: FormProps<S>) {
  const [state, formAction, pending] = useActionState(
    action as unknown as Action<Awaited<S>>,
    initial as Awaited<S>,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const summaryId = useId();

  useEffect(() => {
    if (state.status === 'ok' && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  useEffect(() => {
    if (state.status === 'ok' && successMessage) statusRef.current?.focus();
  }, [state, successMessage]);

  useEffect(() => {
    if (state.status !== 'error') return;
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (invalid ?? summaryRef.current)?.focus();
  }, [state]);

  const value = useMemo(
    () => ({ state: state as FormState<Record<string, unknown>>, pending }),
    [state, pending],
  );

  return (
    <FormContext value={value}>
      <form
        ref={formRef}
        className={styles.form}
        data-compact={compact || undefined}
        action={formAction}
        aria-label={label}
        aria-busy={pending || undefined}
        aria-describedby={state.formError ? summaryId : undefined}
      >
        {state.formError ? (
          <p ref={summaryRef} id={summaryId} className={styles.error} role="alert" tabIndex={-1}>
            {state.formError}
          </p>
        ) : null}
        {/* always in the DOM, so a screen reader has the live region before the message arrives */}
        <div ref={statusRef} className={styles.status} role="status" tabIndex={-1}>
          {state.status === 'ok' && successMessage ? successMessage : null}
        </div>
        {typeof children === 'function' ? children(state as S) : children}
        <div className={styles.actions} data-align={actionsAlign}>
          <Button
            type="submit"
            variant={submitVariant}
            size={submitSize}
            aria-disabled={pending || undefined}
            onClick={(event) => {
              // not `disabled`: the button keeps focus while the action runs, and a second click does nothing
              if (pending) event.preventDefault();
            }}
          >
            {submitLabel}
          </Button>
          {actions}
        </div>
      </form>
    </FormContext>
  );
}
