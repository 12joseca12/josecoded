'use client';

import { createContact } from '@/app/[locale]/(staff)/crm/contactos/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import { SheetCancel } from '../sheet';

export interface NewContactLabels {
  title: string;
  kind: string;
  kindOptions: { value: string; label: string }[];
  name: string;
  organization: string;
  email: string;
  phone: string;
  linkedin: string;
  nextAction: string;
  nextActionHelp: string;
  date: string;
  time: string;
  owner: string;
  ownerHelp: string;
  ownerOptions: { value: string; label: string }[] | null;
  submit: string;
  cancel: string;
  locale: 'es' | 'en';
}

/** Manual contact (`?nuevo=1`). A closer's contact is hers whatever this form says; only the admin sees the owner. */
export function NewContactForm({ labels }: { labels: NewContactLabels }) {
  return (
    <Form action={createContact} submitLabel={labels.submit} label={labels.title} actions={<SheetCancel>{labels.cancel}</SheetCancel>}>
      <Field kind="hidden" name="locale" value={labels.locale} />
      <Field kind="select" name="kind" label={labels.kind} options={labels.kindOptions} defaultValue="lead" required />
      <Field kind="text" name="display_name" label={labels.name} maxLength={200} required autoComplete="off" />
      <Field kind="text" name="organization" label={labels.organization} maxLength={200} autoComplete="off" />
      <Field kind="email" name="email" label={labels.email} maxLength={254} autoComplete="off" />
      <Field kind="tel" name="phone" label={labels.phone} maxLength={40} autoComplete="off" />
      <Field kind="text" name="linkedin_url" label={labels.linkedin} maxLength={300} autoComplete="off" />
      <Field kind="text" name="next_action" label={labels.nextAction} help={labels.nextActionHelp} maxLength={200} />
      <Field kind="date" name="next_action_date" label={labels.date} />
      <Field kind="time" name="next_action_time" label={labels.time} />
      {labels.ownerOptions ? (
        <Field kind="select" name="owner_id" label={labels.owner} help={labels.ownerHelp} options={labels.ownerOptions} defaultValue="" />
      ) : null}
    </Form>
  );
}
