import { getFormatter, getTranslations } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatList, StatRow } from '@/components/staff/stat-list';

import styles from './import-history.module.css';
import table from '../table-stack/crm-table.module.css';

import type { StaffRole } from '@/lib/auth/staff';
import type { ImporterOutcome } from '@/lib/crm/conflicts';
import type { ImportRecord, OwnConflict } from '@/lib/crm/import-types';
import type { Locale, StatusBadgeTone } from '@josecoded/types';

const OUTCOME_TONE: Record<ImporterOutcome, StatusBadgeTone> = {
  pending: 'attention',
  assigned: 'live',
  not_assigned: 'muted',
};

/**
 * Below the wizard: the person's imports (all of them for the admin, with who made each) and, per import, the rows
 * of hers that wait for the admin or were decided. A row in conflict shows its number and its state and nothing
 * else: never who owns the other contact (the read does not even ask for it, and the database would refuse).
 */
export async function ImportHistory({
  locale,
  role,
  imports,
  own,
}: {
  locale: Locale;
  role: StaffRole;
  imports: readonly ImportRecord[];
  own: readonly OwnConflict[];
}) {
  const [t, format] = await Promise.all([
    getTranslations({ locale, namespace: 'crm.import.history' }),
    getFormatter({ locale }),
  ]);
  const isAdmin = role === 'admin';
  const date = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid',
    });

  return (
    <section className={styles.section} aria-labelledby="import-history-title">
      <h2 id="import-history-title" className={styles.heading}>
        {t(isAdmin ? 'titleAdmin' : 'titleCloser')}
      </h2>
      {imports.length === 0 ? (
        <EmptyState title={t('emptyTitle')} text={t('emptyText')} />
      ) : (
        <div className={table.box}>
          <table className={table.table} role="table">
            <caption className="sr-only">{t('caption')}</caption>
            <thead role="rowgroup" className={table.head}>
              <tr role="row">
                <th role="columnheader" scope="col" className={table.th}>
                  {t('file')}
                </th>
                <th role="columnheader" scope="col" className={table.th}>
                  {t('date')}
                </th>
                {(['created', 'updated', 'invalid', 'pending'] as const).map((column) => (
                  <th
                    key={column}
                    role="columnheader"
                    scope="col"
                    className={`${table.th} ${table.right}`}
                  >
                    {t(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody role="rowgroup" className={table.body}>
              {imports.map((item) => (
                <tr key={item.id} role="row" className={table.row}>
                  <td role="cell" data-col="main" className={table.cell}>
                    <div className={table.main}>
                      <strong>{item.fileName}</strong>
                      <span>
                        {isAdmin && item.importer ? item.importer : t('rows', { count: item.rows })}
                      </span>
                    </div>
                  </td>
                  <td role="cell" data-col="meta" data-label={t('date')} className={table.cell}>
                    {date(item.createdAt)}
                  </td>
                  <td
                    role="cell"
                    data-col="meta"
                    data-label={t('created')}
                    className={`${table.cell} ${table.right} ${table.num}`}
                  >
                    {item.created}
                  </td>
                  <td
                    role="cell"
                    data-col="meta"
                    data-label={t('updated')}
                    className={`${table.cell} ${table.right} ${table.num}`}
                  >
                    {item.updated}
                  </td>
                  <td
                    role="cell"
                    data-col="meta"
                    data-label={t('invalid')}
                    className={`${table.cell} ${table.right} ${table.num}`}
                  >
                    {item.skipped}
                  </td>
                  <td role="cell" data-col="status" className={`${table.cell} ${table.right}`}>
                    <StatusBadge tone={item.conflicts > 0 ? 'attention' : 'muted'}>
                      <span className="sr-only">{t('pending')}</span>
                      {item.conflicts}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {own.length > 0 ? (
        <>
          <h3 className={styles.subheading}>{t(isAdmin ? 'ownTitleAdmin' : 'ownTitleCloser')}</h3>
          <StatList>
            {own.map((row) => (
              <StatRow
                key={row.id}
                label={t('ownRow', { line: row.line, file: row.fileName })}
                value={
                  <StatusBadge tone={OUTCOME_TONE[row.outcome]}>
                    {t(`outcome.${row.outcome}`)}
                  </StatusBadge>
                }
              />
            ))}
          </StatList>
          <p className={styles.hint}>{t('ownHint')}</p>
        </>
      ) : null}
    </section>
  );
}
