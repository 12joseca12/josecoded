'use client';

import { closeLeadPaid } from '@/app/[locale]/(staff)/crm/contactos/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import { CloseWhenSaved, SheetCancel } from '../sheet';

export interface CloseLeadLabels {
  title: string;
  amount: string;
  amountHelp: string;
  paidAt: string;
  pack: string | null;
  packOptions: { value: string; label: string }[];
  /** Present when the contact belongs to a closer: Jose's call on the commission. */
  commission: {
    legend: string;
    auto: string;
    yes: string;
    no: string;
  } | null;
  defaultCommission: 'auto' | 'yes' | 'no';
  submit: string;
  cancel: string;
  locale: 'es' | 'en';
}

/**
 * «Cerrar cobrado» (admin). The amount is what was charged without VAT. If the contact is a closer's, Jose decides
 * on the commission: `auto` leaves it to the rule of the database (only a lead the closer opened earns it).
 */
export function CloseLeadForm({
  leadId,
  contactId,
  today,
  labels,
}: {
  leadId: string;
  contactId: string;
  today: string;
  labels: CloseLeadLabels;
}) {
  return (
    <Form action={closeLeadPaid} submitLabel={labels.submit} label={labels.title} actions={<SheetCancel>{labels.cancel}</SheetCancel>}>
      <CloseWhenSaved />
      <Field kind="hidden" name="lead_id" value={leadId} />
      <Field kind="hidden" name="contact_id" value={contactId} />
      <Field kind="hidden" name="locale" value={labels.locale} />
      <Field kind="text" name="amount" label={labels.amount} help={labels.amountHelp} inputMode="numeric" required autoComplete="off" />
      <Field kind="date" name="paid_at" label={labels.paidAt} defaultValue={today} />
      {labels.pack ? <Field kind="select" name="pack_code" label={labels.pack} options={labels.packOptions} required /> : null}
      {labels.commission ? (
        <Field
          kind="radio-group"
          name="commission"
          label={labels.commission.legend}
          defaultValue={labels.defaultCommission}
          options={[
            { value: 'auto', label: labels.commission.auto },
            { value: 'yes', label: labels.commission.yes },
            { value: 'no', label: labels.commission.no },
          ]}
        />
      ) : null}
    </Form>
  );
}
