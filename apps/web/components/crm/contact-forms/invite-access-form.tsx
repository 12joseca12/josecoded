'use client';

import { inviteClientAccess } from '@/app/[locale]/(staff)/crm/contactos/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import { CloseWhenSaved, SheetCancel } from '../sheet';

export interface InviteAccessLabels {
  title: string;
  email: string;
  /** Says whose email it is and that the client gets a message to create the access. */
  help: string;
  /** Only the admin may write another address. */
  emailLocked: boolean;
  submit: string;
  cancel: string;
  locale: 'es' | 'en';
}

/** «Habilitar acceso al portal»: the invitation goes to the email of the contact; only the admin may change it. */
export function InviteAccessForm({
  clientId,
  contactId,
  email,
  labels,
}: {
  clientId: string;
  contactId: string;
  email: string;
  labels: InviteAccessLabels;
}) {
  return (
    <Form action={inviteClientAccess} submitLabel={labels.submit} label={labels.title} actions={<SheetCancel>{labels.cancel}</SheetCancel>}>
      <CloseWhenSaved />
      <Field kind="hidden" name="client_id" value={clientId} />
      <Field kind="hidden" name="contact_id" value={contactId} />
      <Field kind="hidden" name="locale" value={labels.locale} />
      <Field kind="email" name="email" label={labels.email} help={labels.help} defaultValue={email} disabled={labels.emailLocked} autoComplete="off" />
    </Form>
  );
}
