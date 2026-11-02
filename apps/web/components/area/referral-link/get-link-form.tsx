'use client';

import { ensureAffiliate } from '@/app/[locale]/(area)/area-clientes/recomiendame/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import type { Locale } from '@josecoded/types';


/** One button that asks for the user's referral code; the page re-renders with the link when it is done. */
export function GetLinkForm({ locale, submit, label }: { locale: Locale; submit: string; label: string }) {
  return (
    <Form action={ensureAffiliate} submitLabel={submit} label={label}>
      <Field kind="hidden" name="locale" value={locale} />
    </Form>
  );
}
