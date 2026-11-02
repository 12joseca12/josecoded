'use client';

import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { Field } from '@/components/forms/field';
import { Icon } from '@/components/ui/icon';
import { CSV_MAX_BYTES, decodeCsvBytes } from '@/lib/crm/csv';

import styles from './csv-dropzone.module.css';

import type { DragEvent } from 'react';

export type PickedFile = { name: string; text: string; bytes: number };

/**
 * Step 1 of K4: a file (chosen or dropped) or pasted text. The input is the control, hidden inside the label that
 * is the drop area, so it is reachable by keyboard and named («Fichero CSV»); the paste field is a regular `Field`.
 * The file is read here only to hand its text on: size is checked before reading and again by the server, which
 * trusts nothing it receives. Pasted text wins over a chosen file when both are there.
 */
export function CsvDropzone({
  picked,
  disabled,
  onPick,
  onProblem,
}: {
  picked: PickedFile | null;
  disabled: boolean;
  onPick: (file: PickedFile | null) => void;
  /** The file could not be taken: `too_large` or `unreadable`. */
  onProblem: (problem: 'too_large' | 'unreadable') => void;
}) {
  const inputId = useId();
  const hintId = useId();
  const [over, setOver] = useState(false);
  const t = useTranslations('crm.import');

  async function take(file: File | undefined) {
    if (!file) return;
    if (file.size > CSV_MAX_BYTES) {
      onProblem('too_large');
      return;
    }
    try {
      const text = decodeCsvBytes(await file.arrayBuffer());
      onPick({ name: file.name, text, bytes: file.size });
    } catch {
      onProblem('unreadable');
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setOver(false);
    if (!disabled) void take(event.dataTransfer.files[0]);
  }

  return (
    <>
      <label
        htmlFor={inputId}
        className={styles.drop}
        data-over={over || undefined}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <span className={styles.tile} aria-hidden="true">
          <Icon name="file-up" />
        </span>
        <span className={styles.title}>{picked ? picked.name : t('file.dropTitle')}</span>
        <span id={hintId} className={styles.hint}>
          {t('file.dropHint')}
        </span>
        <input
          id={inputId}
          className={styles.input}
          type="file"
          accept=".csv,text/csv,text/plain"
          disabled={disabled}
          aria-describedby={hintId}
          aria-label={t('file.inputLabel')}
          onChange={(event) => {
            void take(event.currentTarget.files?.[0]);
            // the same file twice in a row must still fire a change
            event.currentTarget.value = '';
          }}
        />
        <span className={styles.choose} aria-hidden="true">
          {t('file.choose')}
        </span>
      </label>
      <Field
        kind="textarea"
        name="csv_text"
        label={t('file.pasteLabel')}
        placeholder={t('file.pastePlaceholder')}
        rows={3}
        disabled={disabled}
      />
    </>
  );
}
