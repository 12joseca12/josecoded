'use client';

import { useTranslations } from 'next-intl';

import { Field } from '@/components/forms/field';
import { fieldOfColumn, guessMapping, IMPORT_FIELDS } from '@/lib/crm/import-mapping';

import styles from './column-mapper.module.css';
import table from './import-table.module.css';

import type { ColumnMapping, ImportField } from '@/lib/crm/import-mapping';

const NONE = '';

/**
 * Step 2, first half: each column of the file with an example and the contact field it feeds, corrected with a
 * selector. A column feeds one field and a field comes from one column, so choosing a field that another column
 * had takes it from there (the controlled selects show it at once). Without a name column nothing can be
 * imported: the wizard says so under the table and keeps the button off.
 */
export function ColumnMapper({
  headers,
  samples,
  mapping,
  onChange,
}: {
  headers: readonly string[];
  samples: readonly string[];
  mapping: ColumnMapping;
  onChange: (column: number, field: ImportField | null) => void;
}) {
  const t = useTranslations('crm.import.columns');
  const guessed = guessMapping(headers);
  const options = [
    ...IMPORT_FIELDS.map((field) => ({ value: field, label: t(`fields.${field}`) })),
    { value: NONE, label: t('ignore') },
  ];

  return (
    <div className={table.box}>
      <table className={table.table} role="table">
        <caption className="sr-only">{t('caption')}</caption>
        <thead role="rowgroup" className={table.head}>
          <tr role="row">
            <th role="columnheader" scope="col" className={table.th}>
              {t('column')}
            </th>
            <th role="columnheader" scope="col" className={table.th}>
              {t('field')}
            </th>
            <th role="columnheader" scope="col" className={table.th}>
              <span className="sr-only">{t('origin')}</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className={table.body}>
          {headers.map((header, column) => {
            const field = fieldOfColumn(mapping, column);
            const name = header || t('unnamed', { number: column + 1 });
            const state =
              field === null ? 'ignored' : guessed[field] === column ? 'auto' : 'manual';
            return (
              <tr key={column} role="row" className={table.row}>
                <td role="cell" data-col="main" className={table.cell}>
                  <div className={table.main}>
                    <strong>{name}</strong>
                    <span className={samples[column] ? undefined : table.muted}>
                      {samples[column] || t('noExample')}
                    </span>
                  </div>
                </td>
                <td role="cell" data-col="status" className={table.cell}>
                  <div className={styles.select}>
                    <Field
                      kind="select"
                      name={`column-${column}`}
                      label={t('fieldFor', { column: name })}
                      hideLabel
                      size="compact"
                      options={options}
                      value={field ?? NONE}
                      onChange={(value) =>
                        onChange(column, value === NONE ? null : (value as ImportField))
                      }
                    />
                  </div>
                </td>
                <td role="cell" data-col="meta" className={table.cell}>
                  <span className={styles.origin} data-state={state}>
                    {t(state === 'auto' ? 'auto' : state === 'manual' ? 'manual' : 'ignored')}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
