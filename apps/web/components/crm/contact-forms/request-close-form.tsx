'use client';

import { requestClose } from '@/app/[locale]/(staff)/crm/contactos/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import { CloseWhenSaved, SheetCancel } from '../sheet';

export interface RequestCloseLabels {
  title: string;
  submit: string;
  cancel: string;
  locale: 'es' | 'en';
}

/** «Pedir cierre a Jose»: a closer never closes; this leaves the next action «Jose: cerrar cobrado» and tells him. */
export function RequestCloseForm({ leadId, contactId, labels }: { leadId: string; contactId: string; labels: RequestCloseLabels }) {
  return (
    <Form action={requestClose} submitLabel={labels.submit} label={labels.title} actions={<SheetCancel>{labels.cancel}</SheetCancel>}>
      <CloseWhenSaved />
      <Field kind="hidden" name="lead_id" value={leadId} />
      <Field kind="hidden" name="contact_id" value={contactId} />
      <Field kind="hidden" name="locale" value={labels.locale} />
    </Form>
  );
}
