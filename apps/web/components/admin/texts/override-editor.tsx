'use client';

import { useTranslations } from 'next-intl';
import { useId, useRef } from 'react';

import { StatusBadge } from '@/components/shared/status-badge';
import { Icon } from '@/components/ui/icon';
import { textState } from '@/lib/content/texts';

import styles from './override-editor.module.css';

import type { PublishedText, TextEntry, TextPair } from '@/lib/content/texts';

const LANGS = ['es', 'en'] as const;
const TONES = { modified: 'attention', published: 'active', unchanged: 'muted' } as const;

/**
 * One text of the site, both languages side by side: what `messages/` says today in grey (the base), over the field
 * where the override is written. An empty field means «no override»: the site keeps the base. The same fields serve
 * every namespace, so the editors of FAQ and projects reuse this one.
 *
 * Why not `Field`: this is a composite of two controlled fields that need a `lang`, a base text tied to each one with
 * `aria-describedby` and the language chip inside the label, none of which `Field` offers.
 *
 * A11y: each textarea has a real `<label>` (language name), carries `lang` so a screen reader pronounces it and the
 * browser spell-checks it right, and is described by its base text. The state is text in the badge, never only
 * colour. «Restaurar» names its key and puts the focus back in the first field.
 */
export function OverrideEditor({
  entry,
  draft,
  published,
  onChange,
  onRestore,
}: {
  entry: TextEntry;
  draft: TextPair;
  published: PublishedText | undefined;
  onChange: (lang: 'es' | 'en', value: string) => void;
  onRestore: () => void;
}) {
  const t = useTranslations('adminTexts');
  const id = useId();
  const first = useRef<HTMLTextAreaElement>(null);
  const state = textState(draft, published);
  const restorable = draft.es !== '' || draft.en !== '';

  return (
    <article className={styles.entry} aria-labelledby={`${id}-key`}>
      <div className={styles.head}>
        <h2 className={styles.key} id={`${id}-key`}>
          {entry.key}
        </h2>
        <StatusBadge tone={TONES[state]}>{state === 'published' ? t('states.published', { version: published?.version ?? 0 }) : t(`states.${state}`)}</StatusBadge>
        {restorable ? (
          <button
            type="button"
            className={styles.restore}
            aria-label={t('editor.restoreFor', { key: entry.key })}
            onClick={() => {
              onRestore();
              first.current?.focus();
            }}
          >
            <Icon name="rotate-ccw" />
            {t('editor.restore')}
          </button>
        ) : null}
      </div>
      <div className={styles.bilingual}>
        {LANGS.map((lang) => (
          <div className={styles.field} key={lang}>
            <label htmlFor={`${id}-${lang}`} className={styles.label}>
              <span className={styles.lang} aria-hidden="true">
                {lang.toUpperCase()}
              </span>{' '}
              {t(`languages.${lang}`)}
            </label>
            <p className={styles.base} id={`${id}-${lang}-base`} lang={lang}>
              <span className={styles.baseLabel}>{t('editor.base')}</span> {entry.base[lang]}
            </p>
            <textarea
              ref={lang === 'es' ? first : undefined}
              id={`${id}-${lang}`}
              name={`${entry.key}:${lang}`}
              className={styles.control}
              lang={lang}
              rows={2}
              value={draft[lang]}
              placeholder={t(lang === 'es' ? 'editor.placeholderEs' : 'editor.placeholderEn')}
              aria-describedby={`${id}-${lang}-base`}
              onChange={(event) => onChange(lang, event.currentTarget.value)}
            />
          </div>
        ))}
      </div>
    </article>
  );
}
