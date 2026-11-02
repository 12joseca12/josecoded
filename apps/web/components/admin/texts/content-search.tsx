'use client';

import { useTranslations } from 'next-intl';

import { Field } from '@/components/forms/field';

/**
 * The search of D2 Textos: by key or by text, in both languages. It only holds what is typed; the list and the
 * announcement of how many results there are belong to the screen that owns the texts.
 */
export function ContentSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useTranslations('adminTexts.search');
  return (
    <Field
      kind="search"
      name="q"
      label={t('label')}
      hideLabel
      size="compact"
      placeholder={t('placeholder')}
      leading="search"
      value={value}
      onChange={onChange}
      maxLength={80}
      autoComplete="off"
      spellCheck={false}
    />
  );
}
