import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';

import styles from './import-preview.module.css';
import table from './import-table.module.css';

import type { ImportAnalysis } from '@/lib/crm/import-analysis';

/** Rows named in the «Inválidas» total before the rest are counted. */
const LINES_SHOWN = 3;

/**
 * Step 2, second half: the first rows with their local verdict (valid, or the reason it is not), and the totals.
 * Duplicates are not looked up here: the database decides them on import, so the preview never says who already
 * exists. Everything is rendered as text, so a name that starts with «=» is shown, not run or linked. An invalid row
 * points at its reason with `aria-describedby`, and the reason is text, not just the amber of the icon.
 */
export function ImportPreview({ analysis }: { analysis: ImportAnalysis }) {
  const t = useTranslations('crm.import.preview');
  const tRow = useTranslations('crm.import.errors.row');
  const { preview, total, valid, invalid } = analysis;
  const kindLabel = (kind: string) =>
    kind === ''
      ? t('none')
      : (['lead', 'agency', 'recruiter', 'other'] as const).includes(kind as 'lead')
        ? t(`kinds.${kind as 'lead'}`)
        : kind;
  const shown = invalid.slice(0, LINES_SHOWN).map((item) => item.line);
  const more = invalid.length - shown.length;
  const list = shown.join(', ');
  const lines =
    invalid.length === 0
      ? null
      : t('totals.lines', {
          count: shown.length,
          list: more > 0 ? t('totals.more', { list, more }) : list,
        });

  return (
    <section aria-labelledby="import-preview-title" className={styles.preview}>
      <h3 id="import-preview-title" className={styles.heading}>
        {t('title')}
      </h3>
      <div className={table.box}>
        <table className={table.table} role="table">
          <caption className={table.caption}>
            {preview.length < total
              ? t('caption', { shown: preview.length, total })
              : t('captionAll', { total })}
          </caption>
          <thead role="rowgroup" className={table.head}>
            <tr role="row">
              {(['line', 'contact', 'email', 'phone', 'kind', 'verdict'] as const).map((column) => (
                <th key={column} role="columnheader" scope="col" className={table.th}>
                  {t(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup" className={table.body}>
            {preview.map((row) => {
              const errorId = `import-row-${row.line}-error`;
              return (
                <tr
                  key={row.line}
                  role="row"
                  className={table.row}
                  aria-describedby={row.error ? errorId : undefined}
                >
                  <td
                    role="cell"
                    data-col="meta"
                    data-label={t('line')}
                    className={`${table.cell} ${table.num}`}
                  >
                    {row.line}
                  </td>
                  <td role="cell" data-col="main" className={table.cell}>
                    <div className={table.main}>
                      <strong>{row.name || t('none')}</strong>
                      <span className={row.organization ? undefined : table.muted}>
                        {row.organization || t('noOrganization')}
                      </span>
                    </div>
                  </td>
                  <td role="cell" data-col="meta" className={table.cell}>
                    {row.email || t('none')}
                  </td>
                  <td role="cell" data-col="meta" className={`${table.cell} ${table.num}`}>
                    {row.phone || t('none')}
                  </td>
                  <td role="cell" data-col="meta" className={table.cell}>
                    {kindLabel(row.kind)}
                  </td>
                  <td role="cell" data-col="wide" className={table.cell}>
                    {row.error ? (
                      <span className={styles.verdict} data-ok="false">
                        <Icon name="circle-alert" />
                        <span id={errorId}>{tRow(row.error)}</span>
                      </span>
                    ) : (
                      <span className={styles.verdict} data-ok="true">
                        <Icon name="circle-check" />
                        {t('valid')}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <dl className={styles.totals}>
        <div className={styles.total}>
          <dt>{t('totals.rows')}</dt>
          <dd className={styles.figure}>{total}</dd>
        </div>
        <div className={styles.total} data-tone="live">
          <dt>{t('totals.valid')}</dt>
          <dd className={styles.figure}>{valid}</dd>
        </div>
        <div className={styles.total} data-tone={invalid.length > 0 ? 'attention' : undefined}>
          <dt>{t('totals.invalid')}</dt>
          <dd className={styles.figure}>{invalid.length}</dd>
          {lines ? <dd className={styles.sub}>{lines}</dd> : null}
        </div>
      </dl>
      <p className={styles.note}>
        <Icon name="info" />
        <span>{t('note')}</span>
      </p>
    </section>
  );
}
