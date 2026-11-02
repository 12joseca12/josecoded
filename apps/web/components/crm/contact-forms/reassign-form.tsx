'use client';

import { reassignContact } from '@/app/[locale]/(staff)/crm/contactos/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import { CloseWhenSaved, SheetCancel } from '../sheet';

export interface ReassignLabels {
  title: string;
  owner: string;
  options: { value: string; label: string }[];
  submit: string;
  cancel: string;
  locale: 'es' | 'en';
}

/** Admin only («Reasignar a…»). The submit button is the confirmation: the sheet says who gets the contact. */
export function ReassignForm({ contactId, currentOwner, labels }: { contactId: string; currentOwner: string; labels: ReassignLabels }) {
  return (
    <Form action={reassignContact} submitLabel={labels.submit} label={labels.title} actions={<SheetCancel>{labels.cancel}</SheetCancel>}>
      <CloseWhenSaved />
      <Field kind="hidden" name="contact_id" value={contactId} />
      <Field kind="hidden" name="locale" value={labels.locale} />
      <Field kind="select" name="owner_id" label={labels.owner} options={labels.options} defaultValue={currentOwner} />
    </Form>
  );
}
