'use client';

import { setContactNextAction } from '@/app/[locale]/(staff)/crm/contactos/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import { CloseWhenSaved, SheetCancel } from '../sheet';

export interface NextActionLabels {
  title: string;
  nextAction: string;
  date: string;
  time: string;
  submit: string;
  cancel: string;
  locale: 'es' | 'en';
}

/** The next action of a contact: what, which day, optionally which hour. `done` starts empty (the last one is over). */
export function NextActionForm({
  contactId,
  current,
  labels,
}: {
  contactId: string;
  current: { text: string | null; date: string | null; time: string | null } | null;
  labels: NextActionLabels;
}) {
  return (
    <Form action={setContactNextAction} submitLabel={labels.submit} label={labels.title} actions={<SheetCancel>{labels.cancel}</SheetCancel>}>
      <CloseWhenSaved />
      <Field kind="hidden" name="contact_id" value={contactId} />
      <Field kind="hidden" name="locale" value={labels.locale} />
      <Field kind="text" name="next_action" label={labels.nextAction} defaultValue={current?.text ?? ''} maxLength={200} required />
      <Field kind="date" name="next_action_date" label={labels.date} defaultValue={current?.date ?? ''} required />
      <Field kind="time" name="next_action_time" label={labels.time} defaultValue={current?.time ?? ''} />
    </Form>
  );
}
