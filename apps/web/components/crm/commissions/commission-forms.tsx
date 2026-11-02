'use client';

import { useEffect } from 'react';

import { approveCommission, markCommissionPaid, rejectCommission } from '@/app/[locale]/(staff)/crm/comisiones/actions';
import { Field } from '@/components/forms/field';
import { Form, useFormContext } from '@/components/forms/form';
import { toInputParts } from '@/lib/crm/next-action';

import { CloseWhenSaved, SheetCancel } from '../sheet';
import styles from './commission-actions.module.css';

import type { ButtonVariant, FormState, Locale } from '@josecoded/types';
import type { ReactNode } from 'react';

/** Calls `onSaved` once when the action behind the enclosing `Form` answers `ok` (the host moves the focus after it). */
function WhenSaved({ onSaved }: { onSaved: () => void }) {
  const status = useFormContext()?.state.status;
  useEffect(() => {
    if (status === 'ok') onSaved();
    // the answer of the action is what matters, not the identity of the callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  return null;
}

/** The texts of one dialog, already translated for the commission it is about. */
export interface DialogTexts {
  /** What will be recorded, in a sentence of its own; `null` when the form says it with its own field (the reason). */
  note: ReactNode;
  submit: string;
  cancel: string;
  /** Accessible name of the form. */
  title: string;
}

type Common = {
  commissionId: string;
  locale: Locale;
  texts: DialogTexts;
  onSaved: () => void;
};

/** The shell of the three forms: the hidden fields, the close-when-saved pair and the cancel next to the submit. */
function ConfirmForm<S extends FormState<never>>({
  action,
  commissionId,
  locale,
  texts,
  onSaved,
  submitVariant,
  children,
}: Common & {
  action: (previous: S, data: FormData) => Promise<S>;
  submitVariant: ButtonVariant;
  children?: ReactNode;
}) {
  return (
    <Form<S>
      action={action}
      submitLabel={texts.submit}
      submitVariant={submitVariant}
      label={texts.title}
      actions={<SheetCancel>{texts.cancel}</SheetCancel>}
    >
      <CloseWhenSaved />
      <WhenSaved onSaved={onSaved} />
      <Field kind="hidden" name="commission_id" value={commissionId} />
      <Field kind="hidden" name="locale" value={locale} />
      {texts.note ? <p className={styles.note}>{texts.note}</p> : null}
      {children}
    </Form>
  );
}

/** «Aprobar»: nothing to type, only to confirm. */
export function ApproveForm(props: Common) {
  return <ConfirmForm {...props} action={approveCommission} submitVariant="solid" />;
}

/** «Rechazar»: the reason is mandatory, the closer reads it in her row. */
export function RejectForm({ reason, hint, ...props }: Common & { reason: string; hint: string }) {
  return (
    <ConfirmForm {...props} action={rejectCommission} submitVariant="danger">
      <Field kind="textarea" name="reason" label={reason} help={hint} rows={3} maxLength={1000} required />
    </ConfirmForm>
  );
}

/** «Marcar pagada»: the day of the transfer (not a future one) and an optional note. */
export function PayForm({
  date,
  noteLabel,
  notePlaceholder,
  ...props
}: Common & { date: string; noteLabel: string; notePlaceholder: string }) {
  return (
    <ConfirmForm {...props} action={markCommissionPaid} submitVariant="solid">
      <Field kind="date" name="paid_at" label={date} defaultValue={toInputParts(new Date().toISOString())?.date ?? ''} required />
      <Field kind="text" name="note" label={noteLabel} placeholder={notePlaceholder} maxLength={500} />
    </ConfirmForm>
  );
}
