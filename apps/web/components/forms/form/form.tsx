'use client';

import { useActionState, useEffect, useId, useMemo, useRef } from 'react';

import { Button } from '@/components/ui/button';

import { FormContext } from './form-context';
import styles from './form.module.css';

import type { ButtonVariant, FormState } from '@josecoded/types';
import type { ReactNode } from 'react';

type Action<S> = (previous: S, data: FormData) => Promise<S>;

export interface FormProps<S> {
  action: Action<S>;
  /** Already translated by the page. */
  submitLabel: string;
  submitVariant?: ButtonVariant;
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
 * `aria-invalid` + `aria-describedby`; the success message is a polite `role="status"`; the submit
 * button is disabled while pending and the form is `aria-busy`.
 */
export function Form<S extends FormState<never> = FormState<Record<string, unknown>>>({
  action,
  submitLabel,
  submitVariant = 'solid',
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
  const summaryId = useId();

  useEffect(() => {
    if (state.status === 'ok' && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

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
        {state.status === 'ok' && successMessage ? (
          <p className={styles.success} role="status">
            {successMessage}
          </p>
        ) : null}
        {typeof children === 'function' ? children(state as S) : children}
        <div className={styles.actions}>
          <Button type="submit" variant={submitVariant} disabled={pending}>
            {submitLabel}
          </Button>
          {actions}
        </div>
      </form>
    </FormContext>
  );
}
