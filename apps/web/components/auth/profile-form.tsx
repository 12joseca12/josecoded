'use client';

import { updateProfile } from '@/app/[locale]/(area)/perfil/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import type { Locale } from '@josecoded/types';


export interface ProfileFormProps {
  locale: Locale;
  displayName: string;
  profileLocale: Locale;
  labels: {
    form: string;
    displayName: string;
    displayNameHelp: string;
    locale: string;
    localeEs: string;
    localeEn: string;
    submit: string;
    saved: string;
  };
}

/** Name and language: the only two columns of `user_profiles` the user may update. */
export function ProfileForm({ locale, displayName, profileLocale, labels }: ProfileFormProps) {
  return (
    <Form
      action={updateProfile}
      submitLabel={labels.submit}
      label={labels.form}
      successMessage={labels.saved}
    >
      <Field kind="hidden" name="currentLocale" value={locale} />
      <Field
        kind="text"
        name="displayName"
        label={labels.displayName}
        help={labels.displayNameHelp}
        defaultValue={displayName}
        autoComplete="name"
        maxLength={80}
      />
      <Field
        kind="select"
        name="locale"
        label={labels.locale}
        defaultValue={profileLocale}
        options={[
          { value: 'es', label: labels.localeEs },
          { value: 'en', label: labels.localeEn },
        ]}
      />
    </Form>
  );
}
