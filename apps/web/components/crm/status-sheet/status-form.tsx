'use client';

import { changeContactStatus } from '@/app/[locale]/(staff)/crm/contactos/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import { CloseWhenSaved, SheetCancel } from '../sheet';

import type { StatusOption, StatusSheetContact, StatusSheetLabels } from './types';

/**
 * Status and next action of one contact, saved together: changing to a status that is not final needs the next
 * action (the database refuses otherwise), so the fields sit right under the choice. Inside a `Sheet`.
 */
export function StatusForm({
  contact,
  options,
  labels,
  suggestedStatus,
}: {
  contact: StatusSheetContact;
  options: readonly StatusOption[];
  labels: StatusSheetLabels;
  /** Preselects another status than the current one («Marcar propuesta enviada»). */
  suggestedStatus?: string;
}) {
  const current = suggestedStatus && options.some((option) => option.value === suggestedStatus) ? suggestedStatus : contact.status;
  return (
    <Form
      action={changeContactStatus}
      submitLabel={labels.submit}
      label={labels.title}
      actions={<SheetCancel>{labels.cancel}</SheetCancel>}
    >
      <CloseWhenSaved />
      <Field kind="hidden" name="contact_id" value={contact.id} />
      <Field kind="hidden" name="locale" value={labels.locale} />
      <Field kind="radio-group" name="status" label={labels.status} options={options} defaultValue={current} required />
      <Field kind="text" name="next_action" label={labels.nextAction} help={labels.nextActionHelp} defaultValue={contact.nextAction ?? ''} maxLength={200} />
      <Field kind="date" name="next_action_date" label={labels.date} defaultValue={contact.date ?? ''} />
      <Field kind="time" name="next_action_time" label={labels.time} defaultValue={contact.time ?? ''} />
    </Form>
  );
}
