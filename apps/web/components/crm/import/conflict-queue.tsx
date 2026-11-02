import { getFormatter, getTranslations } from 'next-intl/server';

import { OwnerBadge } from '@/components/crm/owner-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Icon } from '@/components/ui/icon';
import {
  COMPARED_FIELDS,
  differingFields,
  RESOLUTION_ORDER,
  resolutionLabel,
} from '@/lib/crm/conflicts';
import { statusTone } from '@/lib/crm/status';

import { ConflictActions } from './conflict-actions';
import styles from './conflict-queue.module.css';
import table from '../table-stack/crm-table.module.css';

import type { ConflictActionLabels } from './conflict-actions';
import type { ComparedField } from '@/lib/crm/conflicts';
import type { ConflictCase, ConflictQueueData, ResolvedConflict } from '@/lib/crm/import-types';
import type { StatusKey } from '@/lib/crm/status';
import type { ConflictResolutionKind, Locale, StatusBadgeTone } from '@josecoded/types';
import type { ReactNode } from 'react';

const RESOLVED_TONE: Record<ConflictResolutionKind, StatusBadgeTone> = {
  assign_importer: 'live',
  merge: 'active',
  assign_existing: 'muted',
  discard: 'muted',
};

function Row({
  label,
  value,
  differentLabel,
  diff = false,
  empty = false,
}: {
  label: string;
  value: ReactNode;
  differentLabel: string;
  diff?: boolean;
  empty?: boolean;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd
        data-empty={empty || undefined}
        data-diff={diff || undefined}
        data-diff-label={differentLabel}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * The admin's queue (Q22), only rendered by a page that already passed `requireAdmin()`: each pending case with the
 * imported row and the existing contact side by side (the fields the row adds or changes are marked), the optional
 * note and the four resolutions behind a confirmation. Below, the last decisions. Until the admin decides, the row
 * does not enter the CRM and the contact is not touched.
 */
export async function ConflictQueue({ locale, data }: { locale: Locale; data: ConflictQueueData }) {
  const [t, tKinds, tStatus, format] = await Promise.all([
    getTranslations({ locale, namespace: 'crm.import.conflicts' }),
    getTranslations({ locale, namespace: 'crmContacts.kinds' }),
    getTranslations({ locale, namespace: 'crmContacts.status' }),
    getFormatter({ locale }),
  ]);
  const count = data.pending.length;
  const dateTime = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid',
    });
  const day = (iso: string) =>
    format.dateTime(new Date(iso), { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' });

  const labelsFor = (item: ConflictCase): ConflictActionLabels => {
    const actions = Object.fromEntries(
      RESOLUTION_ORDER.map((resolution) => {
        const { key, values } = resolutionLabel(
          resolution,
          item.importerName,
          item.existing.ownerName,
        );
        return [
          resolution,
          { label: t(`action.${key}`, values), confirm: t(`confirm.${key}`, values) },
        ];
      }),
    ) as ConflictActionLabels['actions'];
    return {
      note: t('noteLabel'),
      notePlaceholder: t('notePlaceholder', { importer: item.importerName }),
      group: t('actionsLabel', { line: item.line }),
      cancel: t('cancel'),
      close: t('close'),
      saved: t('saved'),
      actions,
    };
  };

  const face = (item: ConflictCase) => {
    const { imported, existing } = item;
    const differs = new Set<ComparedField>(differingFields(imported, existing));
    const shown = COMPARED_FIELDS.filter((field) => imported[field] || existing[field]);
    const value = (text: string | null) => text ?? t('empty');
    return (
      <div className={styles.faces}>
        <section className={styles.face} aria-label={t('imported')}>
          <p className={styles.faceTitle}>
            <Icon name="file-text" />
            {t('imported')}
            <OwnerBadge name={item.importerName} />
          </p>
          <dl className={styles.dl}>
            <Row
              differentLabel={t('different')}
              label={t('name')}
              value={imported.display_name ?? '—'}
            />
            {shown.map((field) => (
              <Row
                differentLabel={t('different')}
                key={field}
                label={t(field)}
                value={value(imported[field])}
                diff={differs.has(field)}
                empty={!imported[field]}
              />
            ))}
            <Row
              differentLabel={t('different')}
              label={t('kind')}
              value={
                imported.kind && ['lead', 'agency', 'recruiter', 'other'].includes(imported.kind)
                  ? tKinds(imported.kind as 'lead')
                  : (imported.kind ?? '—')
              }
            />
          </dl>
        </section>
        <section className={styles.face} aria-label={t('existing')}>
          <p className={styles.faceTitle}>
            <Icon name="user-round" />
            {t('existing')}
          </p>
          <dl className={styles.dl}>
            <Row differentLabel={t('different')} label={t('name')} value={existing.name} />
            {shown.map((field) => (
              <Row
                differentLabel={t('different')}
                key={field}
                label={t(field)}
                value={value(existing[field])}
                empty={!existing[field]}
              />
            ))}
            <Row
              differentLabel={t('different')}
              label={t('kindStatus')}
              value={
                <span className={styles.kindLine}>
                  <span>{tKinds(existing.kind)}</span>
                  <StatusBadge tone={statusTone(existing.status)}>
                    {tStatus(existing.status as StatusKey)}
                  </StatusBadge>
                </span>
              }
            />
            <Row
              differentLabel={t('different')}
              label={t('owner')}
              value={<OwnerBadge name={existing.ownerName} />}
            />
            <Row
              differentLabel={t('different')}
              label={t('last')}
              value={existing.lastInteractionAt ? day(existing.lastInteractionAt) : t('empty')}
              empty={!existing.lastInteractionAt}
            />
          </dl>
        </section>
      </div>
    );
  };

  const resolved = (rows: readonly ResolvedConflict[]) => {
    return (
      <section className={styles.section} aria-labelledby="import-conflicts-done">
        <h2 id="import-conflicts-done" className={styles.heading}>
          {t('doneTitle')}
        </h2>
        <div className={table.box}>
          <table className={table.table} role="table">
            <caption className="sr-only">{t('doneCaption')}</caption>
            <thead role="rowgroup" className={table.head}>
              <tr role="row">
                {(['doneRow', 'doneImporter', 'doneResolution', 'doneDate'] as const).map(
                  (column) => (
                    <th key={column} role="columnheader" scope="col" className={table.th}>
                      {t(column)}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody role="rowgroup" className={table.body}>
              {rows.map((row) => {
                const { key, values } = resolutionLabel(
                  row.resolution,
                  row.importerName,
                  row.ownerName,
                );
                return (
                  <tr key={row.id} role="row" className={table.row}>
                    <td role="cell" data-col="main" className={table.cell}>
                      <div className={table.main}>
                        <strong>{t('cardTitle', { line: row.line, file: row.fileName })}</strong>
                        <span>{row.rowName}</span>
                      </div>
                    </td>
                    <td
                      role="cell"
                      data-col="meta"
                      data-label={t('doneImporter')}
                      className={table.cell}
                    >
                      <OwnerBadge name={row.importerName} />
                    </td>
                    <td role="cell" data-col="status" className={table.cell}>
                      <StatusBadge tone={RESOLVED_TONE[row.resolution]}>
                        {t(`resolved.${key}`, values)}
                      </StatusBadge>
                    </td>
                    <td
                      role="cell"
                      data-col="meta"
                      data-label={t('doneDate')}
                      className={table.cell}
                    >
                      {row.resolvedAt ? day(row.resolvedAt) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <div className={styles.queue}>
      {/* the band is the live region: when a case is resolved and the page refreshes, the new count is announced */}
      <div role="status">
        {count > 0 ? (
          <p className={styles.band}>
            <Icon name="git-merge" />
            <span>
              <strong>{t('bandTitle', { count })}</strong> {t('bandText', { count })}
            </span>
          </p>
        ) : (
          <EmptyState title={t('emptyTitle')} text={t('emptyText')} />
        )}
      </div>
      {data.pending.map((item) => (
        <article key={item.id} className={styles.card} aria-labelledby={`conflict-${item.id}`}>
          <header className={styles.cardHead}>
            <h2 id={`conflict-${item.id}`} className={styles.cardTitle}>
              {t('cardTitle', { line: item.line, file: item.fileName })}
            </h2>
            <span className={styles.meta}>
              {t('cardMeta', { importer: item.importerName, date: dateTime(item.createdAt) })}
            </span>
          </header>
          {face(item)}
          <ConflictActions conflictId={item.id} locale={locale} labels={labelsFor(item)} />
        </article>
      ))}
      {data.resolved.length > 0 ? resolved(data.resolved) : null}
    </div>
  );
}
