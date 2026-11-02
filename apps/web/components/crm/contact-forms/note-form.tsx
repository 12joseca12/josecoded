'use client';

import { addContactNote } from '@/app/[locale]/(staff)/crm/contactos/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

export interface NoteLabels {
  label: string;
  submit: string;
  saved: string;
  locale: 'es' | 'en';
}

/** A note in the history of the contact. Saved, the field empties and a polite status says so. */
export function NoteForm({ contactId, labels }: { contactId: string; labels: NoteLabels }) {
  return (
    <Form action={addContactNote} submitLabel={labels.submit} submitVariant="ghost" label={labels.label} successMessage={labels.saved} resetOnSuccess>
      <Field kind="hidden" name="contact_id" value={contactId} />
      <Field kind="hidden" name="locale" value={labels.locale} />
      <Field kind="textarea" name="body" label={labels.label} rows={3} maxLength={4000} required />
    </Form>
  );
}
